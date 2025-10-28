import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openai } from "./openai";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { 
  requireAuth, 
  requireParentAuth, 
  requireFamilyAuth,
  rateLimitPIN,
  trackFailedAttempt,
  clearFailedAttempts
} from "./auth";
import {
  insertAudioFileSchema,
  insertAffirmationSchema,
  insertActivitySchema,
  insertJokeSchema,
  insertTtsSettingSchema,
  insertChildSchema,
  insertEmotionCheckInSchema,
  insertFamilySchema,
  insertParentSchema,
  insertFamilySettingSchema,
  insertAssetDistributionSchema,
  type EmotionCategory,
  type ChildResponseContent,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();
  // ===== Object Storage for Audio =====
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectFile(req.params.objectPath);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error fetching object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/audio/upload-url", async (req, res) => {
    try {
      const { contentType } = req.body;
      const uploadURL = await objectStorageService.getAudioUploadURL(contentType || "audio/mpeg");
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/audio/normalize-path", async (req, res) => {
    try {
      const { uploadURL } = req.body;
      
      if (!uploadURL) {
        return res.status(400).json({ error: "Upload URL is required" });
      }

      const objectPath = objectStorageService.normalizeObjectPath(uploadURL);
      res.json({ objectPath });
    } catch (error) {
      console.error("Error normalizing path:", error);
      res.status(500).json({ error: "Failed to normalize path" });
    }
  });

  app.post("/api/audio/categorize", async (req, res) => {
    try {
      const { uploadURL, name } = req.body;
      
      if (!uploadURL || !name) {
        return res.status(400).json({ error: "Upload URL and name are required" });
      }

      const objectPath = objectStorageService.normalizeObjectPath(uploadURL);

      // Use AI to categorize the audio based on its name
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are categorizing audio files for a children's emotional learning app. Based on the audio file name, determine which emotion category it best fits:
            
- red: For calming music, soothing sounds for angry/upset/frustrated feelings
- yellow: For reassuring music, gentle sounds for nervous/worried/scared feelings  
- green: For upbeat music, celebratory sounds for happy/excited/proud feelings
- general: For neutral music that fits all emotions

Respond in JSON with: {"category": "red|yellow|green|general", "reasoning": "brief explanation"}`,
          },
          {
            role: "user",
            content: `Audio file name: "${name}"`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const aiResult = JSON.parse(aiResponse.choices[0].message.content || "{}");
      const category: EmotionCategory = aiResult.category || "general";

      res.json({ objectPath, category, reasoning: aiResult.reasoning });
    } catch (error) {
      console.error("Error categorizing audio:", error);
      res.status(500).json({ error: "Failed to categorize audio" });
    }
  });

  // ===== Audio Files =====
  app.get("/api/audio", async (req, res) => {
    try {
      const audioFiles = await storage.getAllAudio();
      res.json(audioFiles);
    } catch (error) {
      console.error("Error fetching audio:", error);
      res.status(500).json({ error: "Failed to fetch audio files" });
    }
  });

  app.post("/api/audio", async (req, res) => {
    try {
      const data = insertAudioFileSchema.parse(req.body);
      const audio = await storage.createAudio(data);
      res.json(audio);
    } catch (error) {
      console.error("Error creating audio:", error);
      res.status(400).json({ error: "Invalid audio data" });
    }
  });

  app.put("/api/audio/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAudioFileSchema.partial().parse(req.body);
      const audio = await storage.updateAudio(id, data);
      if (!audio) {
        return res.status(404).json({ error: "Audio not found" });
      }
      res.json(audio);
    } catch (error) {
      console.error("Error updating audio:", error);
      res.status(400).json({ error: "Invalid audio data" });
    }
  });

  app.delete("/api/audio/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAudio(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting audio:", error);
      res.status(500).json({ error: "Failed to delete audio" });
    }
  });

  // ===== Affirmations =====
  app.get("/api/affirmations", async (req, res) => {
    try {
      const affirmations = await storage.getAllAffirmations();
      res.json(affirmations);
    } catch (error) {
      console.error("Error fetching affirmations:", error);
      res.status(500).json({ error: "Failed to fetch affirmations" });
    }
  });

  app.post("/api/affirmations", async (req, res) => {
    try {
      const data = insertAffirmationSchema.parse(req.body);
      const affirmation = await storage.createAffirmation(data);
      res.json(affirmation);
    } catch (error) {
      console.error("Error creating affirmation:", error);
      res.status(400).json({ error: "Invalid affirmation data" });
    }
  });

  app.put("/api/affirmations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAffirmationSchema.partial().parse(req.body);
      const affirmation = await storage.updateAffirmation(id, data);
      if (!affirmation) {
        return res.status(404).json({ error: "Affirmation not found" });
      }
      res.json(affirmation);
    } catch (error) {
      console.error("Error updating affirmation:", error);
      res.status(400).json({ error: "Invalid affirmation data" });
    }
  });

  app.delete("/api/affirmations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAffirmation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting affirmation:", error);
      res.status(500).json({ error: "Failed to delete affirmation" });
    }
  });

  // ===== Activities =====
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const data = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(data);
      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.put("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(id, data);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteActivity(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // ===== Jokes =====
  app.get("/api/jokes", async (req, res) => {
    try {
      const jokes = await storage.getAllJokes();
      res.json(jokes);
    } catch (error) {
      console.error("Error fetching jokes:", error);
      res.status(500).json({ error: "Failed to fetch jokes" });
    }
  });

  app.post("/api/jokes", async (req, res) => {
    try {
      const data = insertJokeSchema.parse(req.body);
      const joke = await storage.createJoke(data);
      res.json(joke);
    } catch (error) {
      console.error("Error creating joke:", error);
      res.status(400).json({ error: "Invalid joke data" });
    }
  });

  app.put("/api/jokes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertJokeSchema.partial().parse(req.body);
      const joke = await storage.updateJoke(id, data);
      if (!joke) {
        return res.status(404).json({ error: "Joke not found" });
      }
      res.json(joke);
    } catch (error) {
      console.error("Error updating joke:", error);
      res.status(400).json({ error: "Invalid joke data" });
    }
  });

  app.delete("/api/jokes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteJoke(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting joke:", error);
      res.status(500).json({ error: "Failed to delete joke" });
    }
  });

  // ===== TTS Settings =====
  app.get("/api/tts-settings", async (req, res) => {
    try {
      const settings = await storage.getTtsSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching TTS settings:", error);
      res.status(500).json({ error: "Failed to fetch TTS settings" });
    }
  });

  app.put("/api/tts-settings", async (req, res) => {
    try {
      const data = insertTtsSettingSchema.parse(req.body);
      const settings = await storage.updateTtsSettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating TTS settings:", error);
      res.status(400).json({ error: "Invalid TTS settings data" });
    }
  });

  // ===== Session Management =====
  app.get("/api/session", async (req, res) => {
    try {
      if (req.session.familyId || req.session.parentId) {
        res.json({
          authenticated: true,
          userType: req.session.userType,
          familyId: req.session.familyId,
          parentId: req.session.parentId,
          childId: req.session.childId,
          familyCode: req.session.familyCode
        });
      } else {
        res.json({ authenticated: false });
      }
    } catch (error) {
      console.error("Error checking session:", error);
      res.status(500).json({ error: "Failed to check session" });
    }
  });

  app.post("/api/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // ===== Children Profiles =====
  app.get("/api/children", requireFamilyAuth, async (req, res) => {
    try {
      const { familyCode } = req.query;
      console.log("[Get Children] Query familyCode:", familyCode);
      console.log("[Get Children] Session:", {
        familyId: req.session.familyId,
        familyCode: req.session.familyCode
      });
      
      // Require familyCode for data security
      if (!familyCode) {
        return res.status(400).json({ error: "Family code is required" });
      }
      
      const childrenList = await storage.getChildrenByFamilyCode(familyCode as string);
      console.log("[Get Children] Found", childrenList.length, "children");
      console.log("[Get Children] Children:", childrenList.map(c => ({ id: c.id, name: c.name, familyCode: c.familyCode })));
      
      res.json(childrenList);
    } catch (error) {
      console.error("[Get Children] Error:", error);
      res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  app.post("/api/children", requireParentAuth, async (req, res) => {
    try {
      console.log("[Create Child] Request body:", req.body);
      console.log("[Create Child] Session data:", {
        parentId: req.session.parentId,
        familyId: req.session.familyId,
        familyCode: req.session.familyCode
      });
      
      const data = insertChildSchema.parse(req.body);
      console.log("[Create Child] Validated data:", data);
      
      const child = await storage.createChild(data);
      console.log("[Create Child] Created child:", child);
      
      res.json(child);
    } catch (error) {
      console.error("[Create Child] Error:", error);
      res.status(400).json({ error: "Invalid child data" });
    }
  });

  app.get("/api/children/:id", requireParentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const child = await storage.getChildById(id);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      res.json(child);
    } catch (error) {
      console.error("Error fetching child:", error);
      res.status(500).json({ error: "Failed to fetch child" });
    }
  });

  app.put("/api/children/:id", requireParentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertChildSchema.partial().parse(req.body);
      const child = await storage.updateChild(id, data);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      res.json(child);
    } catch (error) {
      console.error("Error updating child:", error);
      res.status(400).json({ error: "Invalid child data" });
    }
  });

  app.delete("/api/children/:id", requireParentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteChild(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ error: "Failed to delete child" });
    }
  });

  // ===== Emotion Check-Ins =====
  app.post("/api/check-ins", async (req, res) => {
    try {
      const data = insertEmotionCheckInSchema.parse(req.body);
      const checkIn = await storage.createCheckIn(data);
      res.json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      res.status(400).json({ error: "Invalid check-in data" });
    }
  });

  app.get("/api/emotion-checkins", async (req, res) => {
    try {
      const { childId } = req.query;
      if (!childId) {
        return res.status(400).json({ error: "Child ID is required" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const checkIns = await storage.getCheckInsByChild(childId as string, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  app.get("/api/check-ins/child/:childId", async (req, res) => {
    try {
      const { childId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const checkIns = await storage.getCheckInsByChild(childId, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  app.get("/api/check-ins/family/:familyCode", async (req, res) => {
    try {
      const { familyCode } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const checkIns = await storage.getCheckInsByFamilyCode(familyCode, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching family check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  // ===== Dashboard Analytics =====
  app.get("/api/dashboard", requireParentAuth, async (req, res) => {
    try {
      const { familyCode } = req.query;
      
      if (!familyCode) {
        return res.status(400).json({ error: "Family code is required" });
      }

      const children = await storage.getChildrenByFamilyCode(familyCode as string);
      const allCheckIns = await storage.getCheckInsByFamilyCode(familyCode as string, 1000);

      const emotionBreakdown = {
        red: allCheckIns.filter(c => c.emotionCategory === "red").length,
        yellow: allCheckIns.filter(c => c.emotionCategory === "yellow").length,
        green: allCheckIns.filter(c => c.emotionCategory === "green").length,
      };

      const childrenStats = children.map(child => {
        const childCheckIns = allCheckIns.filter(c => c.childId === child.id);
        const lastCheckIn = childCheckIns.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        return {
          child,
          checkIns: childCheckIns.length,
          lastEmotion: lastCheckIn?.emotionCategory,
        };
      });

      const recentCheckIns = allCheckIns
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      res.json({
        totalCheckIns: allCheckIns.length,
        emotionBreakdown,
        childrenStats,
        recentCheckIns,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ===== Text-to-Speech Generation =====
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const { text, voice = "nova" } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const { generateSpeechBase64 } = await import("./openai-tts");
      const audioBase64 = await generateSpeechBase64(text, voice);

      res.json({ 
        audio: `data:audio/mp3;base64,${audioBase64}`,
        voice: voice
      });
    } catch (error) {
      console.error("Error generating TTS:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // ===== Calendar Insights =====
  app.post("/api/calendar-insights", async (req, res) => {
    try {
      const { childId, checkIns } = req.body;

      if (!childId || !checkIns || checkIns.length === 0) {
        return res.status(400).json({ error: "Child ID and check-ins are required" });
      }

      // Prepare data for AI analysis
      const recentCheckIns = checkIns.slice(-30); // Last 30 check-ins for analysis
      const emotionCounts = { red: 0, yellow: 0, green: 0 };
      const dayOfWeekPatterns: Record<string, number[]> = {};
      
      recentCheckIns.forEach((checkIn: any) => {
        emotionCounts[checkIn.detectedEmotion as keyof typeof emotionCounts]++;
        const day = new Date(checkIn.createdAt).getDay();
        if (!dayOfWeekPatterns[day]) dayOfWeekPatterns[day] = [0, 0, 0];
        dayOfWeekPatterns[day][checkIn.detectedEmotion === 'red' ? 0 : checkIn.detectedEmotion === 'yellow' ? 1 : 2]++;
      });

      // Use OpenAI to generate insights
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a caring child psychologist assistant analyzing emotional patterns for children. 
            Provide warm, supportive insights that are both helpful for parents/teachers and age-appropriate if shared with the child.
            Focus on patterns, positive trends, and gentle suggestions. Keep the response under 150 words.`
          },
          {
            role: "user",
            content: `Analyze these emotional check-in patterns for a child:
            - Total check-ins (last 30 days): ${recentCheckIns.length}
            - Red (difficult) days: ${emotionCounts.red}
            - Yellow (unsure) days: ${emotionCounts.yellow}  
            - Green (good) days: ${emotionCounts.green}
            - Recent trend: ${recentCheckIns.slice(-7).map((c: any) => c.detectedEmotion).join(', ')}
            
            Provide supportive insights about their emotional journey and any patterns you notice.`
          }
        ]
      });

      const insights = aiResponse.choices[0].message.content || "Unable to generate insights at this time.";

      res.json({ insights });
    } catch (error) {
      console.error("Error generating calendar insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // ===== AI Emotion Analysis =====
  app.post("/api/analyze-emotion", async (req, res) => {
    try {
      const { emotion, text, childId } = req.body;

      if (!emotion || !text) {
        return res.status(400).json({ error: "Emotion and text are required" });
      }

      // Use AI to analyze the emotion and refine the category
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using a smaller model for cost efficiency
        messages: [
          {
            role: "system",
            content: `You are a caring emotional intelligence assistant for children. Based on what the child shares, determine if their emotion category is accurate. 
            
Categories:
- red: Angry, frustrated, sad, upset, mad
- yellow: Nervous, worried, scared, anxious, unsure
- green: Happy, calm, excited, proud, joyful

Respond in JSON with: {"category": "red|yellow|green", "reasoning": "brief explanation"}`,
          },
          {
            role: "user",
            content: `The child selected "${emotion}" and shared: "${text}"`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const aiResult = JSON.parse(aiResponse.choices[0].message.content || "{}");
      const finalCategory: EmotionCategory = aiResult.category || emotion;

      // Save emotion check-in if childId is provided
      if (childId) {
        await storage.createCheckIn({
          childId,
          emotionCategory: emotion,
          feelingText: text,
          detectedEmotion: finalCategory,
        });
      }

      // Fetch content for this emotion category
      const [audioFiles, affirmations, activities, jokes] = await Promise.all([
        storage.getAudioByCategory(finalCategory),
        storage.getAffirmationsByCategory(finalCategory),
        storage.getActivitiesByCategory(finalCategory),
        storage.getJokesByCategory(finalCategory),
      ]);

      // Select random items from each category
      const response: ChildResponseContent = {
        audio: audioFiles.length > 0 
          ? audioFiles[Math.floor(Math.random() * audioFiles.length)]
          : undefined,
        affirmation: affirmations.length > 0
          ? affirmations[Math.floor(Math.random() * affirmations.length)]
          : undefined,
        activity: activities.length > 0
          ? activities[Math.floor(Math.random() * activities.length)]
          : undefined,
        joke: jokes.length > 0
          ? jokes[Math.floor(Math.random() * jokes.length)]
          : undefined,
      };

      res.json(response);
    } catch (error) {
      console.error("Error analyzing emotion:", error);
      res.status(500).json({ error: "Failed to analyze emotion" });
    }
  });

  // Debug endpoint to check database connection
  app.get("/api/health", async (req, res) => {
    try {
      // Try a simple database query
      const result = await storage.getAllAudio();
      res.json({ 
        status: "ok", 
        database: "connected",
        environment: process.env.NODE_ENV,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        audioCount: result.length
      });
    } catch (error: any) {
      console.error("[Health Check] Database error:", error);
      res.status(500).json({ 
        status: "error", 
        database: "disconnected",
        error: error?.message 
      });
    }
  });

  // ===== Family Management =====
  app.post("/api/families", async (req, res) => {
    try {
      console.log("[Family Creation] Starting family creation");
      console.log("[Family Creation] Request body:", JSON.stringify(req.body, null, 2));
      console.log("[Family Creation] Environment:", process.env.NODE_ENV);
      
      // Validate input using Zod schema
      let data;
      try {
        data = insertFamilySchema.parse(req.body);
        console.log("[Family Creation] Input validated successfully");
      } catch (validationError: any) {
        console.error("[Family Creation] Validation error:", validationError);
        console.error("[Family Creation] Validation errors:", validationError?.errors);
        return res.status(400).json({ 
          error: "Validation failed",
          details: validationError?.errors || validationError?.message
        });
      }
      
      // The storage layer will handle PIN hashing
      const family = await storage.createFamily(data);
      console.log("[Family Creation] Family created:", family.id);
      
      // Create default parent account for the family
      const parent = await storage.createParent({
        familyId: family.id,
        name: data.familyName + " Admin",
        role: "parent" as any,
      });
      console.log("[Family Creation] Parent account created:", parent.id);
      
      // Create default family settings
      await storage.upsertFamilySettings(family.id, {
        familyId: family.id,
      });
      console.log("[Family Creation] Family settings created");
      
      // Establish session for the new family
      req.session.familyId = family.id;
      req.session.familyCode = family.familyCode;
      req.session.parentId = parent.id;
      req.session.userType = 'parent';
      
      // Save session before sending response - WAIT for it to complete
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('[Family Creation] Failed to save session:', err);
            reject(err);
          } else {
            console.log('[Family Creation] Session saved successfully');
            console.log('[Family Creation] Session data:', {
              familyId: req.session.familyId,
              parentId: req.session.parentId,
              userType: req.session.userType,
              familyCode: req.session.familyCode
            });
            resolve();
          }
        });
      });
      
      console.log("[Family Creation] Success! Family ID:", family.id);
      res.json({ family, parent });
    } catch (error: any) {
      console.error("[Family Creation] ERROR:", error);
      console.error("[Family Creation] Error stack:", error?.stack);
      console.error("[Family Creation] Error details:", {
        message: error?.message,
        code: error?.code,
        name: error?.name
      });
      res.status(400).json({ 
        error: "Failed to create family",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  });

  app.post("/api/families/validate-pin", async (req, res) => {
    try {
      const { familyCode, pin } = req.body;
      
      if (!familyCode || !pin) {
        return res.status(400).json({ error: "Family code and PIN are required" });
      }
      
      // Check rate limiting
      if (!rateLimitPIN(`family:${familyCode}`)) {
        return res.status(429).json({ error: "Too many failed attempts. Please try again later." });
      }
      
      const isValid = await storage.validateFamilyPin(familyCode, pin);
      
      if (!isValid) {
        trackFailedAttempt(`family:${familyCode}`);
        return res.status(401).json({ valid: false, error: "Invalid PIN" });
      }
      
      // Clear failed attempts on successful login
      clearFailedAttempts(`family:${familyCode}`);
      
      const family = await storage.getFamilyByCode(familyCode);
      
      if (family) {
        // Set up session for family authentication
        req.session.familyId = family.id;
        req.session.familyCode = family.familyCode;
        req.session.userType = 'family';
        
        // Save session before sending response - WAIT for it to complete
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Failed to save session:', err);
              reject(err);
            } else {
              console.log('Family PIN validation session saved successfully');
              resolve();
            }
          });
        });
        
        const parents = await storage.getParentsByFamily(family.id);
        res.json({ isValid: true, family, parents });
      } else {
        res.json({ isValid: false });
      }
    } catch (error) {
      console.error("Error validating PIN:", error);
      res.status(500).json({ error: "Failed to validate PIN" });
    }
  });

  app.get("/api/families/:familyCode", async (req, res) => {
    try {
      const { familyCode } = req.params;
      const family = await storage.getFamilyByCode(familyCode);
      
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }
      
      res.json(family);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ error: "Failed to fetch family" });
    }
  });

  // ===== Parent Management =====
  app.get("/api/parents/:familyId", async (req, res) => {
    try {
      const { familyId } = req.params;
      const parents = await storage.getParentsByFamily(familyId);
      res.json(parents);
    } catch (error) {
      console.error("Error fetching parents:", error);
      res.status(500).json({ error: "Failed to fetch parents" });
    }
  });

  app.post("/api/parents", async (req, res) => {
    try {
      // Validate input using Zod schema
      const data = insertParentSchema.parse(req.body);
      
      // The storage layer will handle PIN hashing if provided
      const parent = await storage.createParent(data);
      res.json(parent);
    } catch (error) {
      console.error("Error creating parent:", error);
      res.status(400).json({ error: "Failed to create parent" });
    }
  });

  app.post("/api/parents/login", async (req, res) => {
    try {
      const { familyName, pin } = req.body;
      
      if (!familyName || !pin) {
        return res.status(400).json({ success: false, error: "Family name and PIN are required" });
      }
      
      // Check rate limiting
      if (!rateLimitPIN(`parent:${familyName}`)) {
        return res.status(429).json({ success: false, error: "Too many failed attempts. Please try again later." });
      }
      
      // Find family by name (family code)
      const family = await storage.getFamilyByCode(familyName);
      if (!family) {
        trackFailedAttempt(`parent:${familyName}`);
        return res.status(401).json({ success: false, error: "Invalid family name or PIN" });
      }
      
      // Validate PIN
      const isValid = await storage.validateFamilyPin(familyName, pin);
      if (!isValid) {
        trackFailedAttempt(`parent:${familyName}`);
        return res.status(401).json({ success: false, error: "Invalid family name or PIN" });
      }
      
      // Clear failed attempts on successful login
      clearFailedAttempts(`parent:${familyName}`);
      
      // Get parent accounts for this family
      const parents = await storage.getParentsByFamily(family.id);
      if (parents.length === 0) {
        return res.status(404).json({ success: false, error: "No parent account found" });
      }
      
      // Use the first parent account (typically the admin)
      const parent = parents[0];
      
      // Set up session for parent authentication
      req.session.familyId = family.id;
      req.session.familyCode = family.familyCode;
      req.session.parentId = parent.id;
      req.session.userType = 'parent';
      
      // Save session before sending response
      req.session.save((err) => {
        if (err) {
          console.error('Failed to save session:', err);
        }
      });
      
      res.json({ success: true, family, parent });
    } catch (error) {
      console.error("Error logging in parent:", error);
      res.status(500).json({ success: false, error: "Failed to login" });
    }
  });

  app.post("/api/parents/validate-pin", async (req, res) => {
    try {
      const { parentId, pin } = req.body;
      
      if (!parentId || !pin) {
        return res.status(400).json({ error: "Parent ID and PIN are required" });
      }
      
      // Check rate limiting
      if (!rateLimitPIN(`parent:${parentId}`)) {
        return res.status(429).json({ error: "Too many failed attempts. Please try again later." });
      }
      
      const isValid = await storage.validateParentPin(parentId, pin);
      
      if (!isValid) {
        trackFailedAttempt(`parent:${parentId}`);
        return res.status(401).json({ valid: false, error: "Invalid PIN" });
      }
      
      // Clear failed attempts on successful login
      clearFailedAttempts(`parent:${parentId}`);
      
      if (isValid) {
        const parent = await storage.getParentById(parentId);
        if (parent) {
          // Set up session for parent authentication
          req.session.parentId = parent.id;
          req.session.familyId = parent.familyId;
          req.session.userType = 'parent';
          
          // Get family code for the session
          const family = await storage.getFamilyById(parent.familyId);
          if (family) {
            req.session.familyCode = family.familyCode;
          }
          
          // Save session before sending response - WAIT for it to complete
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error('Failed to save session:', err);
                reject(err);
              } else {
                console.log('Parent PIN validation session saved successfully');
                console.log('Parent session data:', {
                  parentId: req.session.parentId,
                  familyId: req.session.familyId,
                  familyCode: req.session.familyCode,
                  userType: req.session.userType
                });
                resolve();
              }
            });
          });
          
          res.json({ isValid: true, parent });
        } else {
          res.json({ isValid: false });
        }
      } else {
        res.json({ isValid: false });
      }
    } catch (error) {
      console.error("Error validating parent PIN:", error);
      res.status(500).json({ error: "Failed to validate PIN" });
    }
  });

  // ===== Family Settings =====
  app.get("/api/family-settings/:familyId", requireParentAuth, async (req, res) => {
    try {
      const { familyId } = req.params;
      const settings = await storage.getFamilySettings(familyId);
      
      if (!settings) {
        // Create default settings if none exist
        const newSettings = await storage.upsertFamilySettings(familyId, {
          familyId,
        });
        return res.json(newSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching family settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/family-settings/:familyId", async (req, res) => {
    try {
      const { familyId } = req.params;
      const data = insertFamilySettingSchema.parse(req.body);
      const settings = await storage.upsertFamilySettings(familyId, data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating family settings:", error);
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  // ===== Asset Distribution Management =====
  app.get("/api/asset-distributions/:familyId", requireParentAuth, async (req, res) => {
    try {
      const { familyId } = req.params;
      const distributions = await storage.getAssetDistributions(familyId);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching distributions:", error);
      res.status(500).json({ error: "Failed to fetch distributions" });
    }
  });

  app.post("/api/asset-distributions", requireParentAuth, async (req, res) => {
    try {
      const data = insertAssetDistributionSchema.parse(req.body);
      const distribution = await storage.createAssetDistribution(data);
      res.json(distribution);
    } catch (error) {
      console.error("Error creating distribution:", error);
      res.status(400).json({ error: "Failed to create distribution" });
    }
  });

  app.put("/api/asset-distributions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const distribution = await storage.updateAssetDistribution(id, data);
      
      if (!distribution) {
        return res.status(404).json({ error: "Distribution not found" });
      }
      
      res.json(distribution);
    } catch (error) {
      console.error("Error updating distribution:", error);
      res.status(400).json({ error: "Failed to update distribution" });
    }
  });

  app.delete("/api/asset-distributions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAssetDistribution(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting distribution:", error);
      res.status(500).json({ error: "Failed to delete distribution" });
    }
  });

  app.get("/api/asset-distributions/child/:childId/:assetType", async (req, res) => {
    try {
      const { childId, assetType } = req.params;
      const assetIds = await storage.getFilteredAssetsForChild(childId, assetType);
      res.json({ assetIds });
    } catch (error) {
      console.error("Error fetching child assets:", error);
      res.status(500).json({ error: "Failed to fetch child assets" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
