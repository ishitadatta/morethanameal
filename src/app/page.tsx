"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  cooking_skill: string | null;
  social_preference: string | null;
  goals: string[] | null;
  dietary_preferences?: string[] | null;
  allergies?: string[] | null;
  grocery_distance_minutes: number | null;
  has_car: boolean;
  can_host: boolean;
  host_capacity: number | null;
  dishwasher: boolean;
  utensils_ready: boolean;
  onboarding_completed?: boolean | null;
};

type Pod = {
  id: string;
  name: string;
  slug: string;
  meal_mode: string;
  menu_type: string;
  portion_count: number;
  host_notes: string | null;
  scheduled_for: string | null;
};

type RecipeOption = {
  id: string;
  title: string;
  description: string | null;
};

type Task = {
  id: string;
  title: string;
  category: string;
  status: string;
};

type Message = {
  id: string;
  body: string;
  user_id: string;
};

type FriendProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
};

type PodMember = {
  user_id: string;
  connection_type: string;
  role: string;
};

type PodMemberProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  dietary_preferences: string[] | null;
  allergies: string[] | null;
};

type SuggestedPod = {
  slug: string;
  name: string;
  description: string;
  meal_mode: string;
  menu_type: string;
  portion_count: number;
  host_notes: string;
  tags: string[];
  rationale: string[];
};

const goalOptions = [
  "Save money",
  "Eat socially",
  "Learn techniques",
  "Meal prep",
  "Try new cuisines",
  "Host more often",
  "Reduce food waste",
  "Keep groceries nearby",
  "Stay on budget",
  "Low-effort cleanup",
];

const budgetOptions = ["Lowest cost", "Balanced", "Ingredient quality first"];

const geographyOptions = ["Walkable only", "Nearby drive", "Flexible across town"];

const supportStyleOptions = ["Lead cook", "Happy helper", "Prep + cleanup", "Need guidance"];

const connectionPreferenceOptions = ["1st-degree friends", "2nd-degree mutuals", "Open mix"];

const courseOptions = ["Main only", "Appetizer + main", "Main + dessert", "Main + dessert + drinks"];

const supportNeedOptions = ["Need a grocery ride", "Need recipe guidance", "Need prep help"];

const dietaryPreferenceOptions = [
  "No preference",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Avoid red meat",
  "Halal",
  "Gluten-free",
  "Dairy-free",
];

const allergyOptions = [
  "Nuts",
  "Shellfish",
  "Dairy",
  "Eggs",
  "Soy",
  "Gluten",
];

const socialOptions = [
  "Friends + 2nd-degree mutuals",
  "First-degree friends only",
  "Open to strangers",
];

const skillOptions = [
  "Confident with basics",
  "Can follow Serious Eats",
  "Need structured recipes",
];

const quizSteps = [
  { key: "intro", title: "Let's build your pod profile", subtitle: "This only takes a minute." },
  { key: "name", title: "What should your pod call you?", subtitle: "Use the name your friends will recognize." },
  { key: "skill", title: "What is your cooking skillset?", subtitle: "We use this to balance the pod." },
  { key: "goals", title: "What are you optimizing for?", subtitle: "Pick the goals that matter most this week." },
  { key: "diet", title: "What should we avoid or plan around?", subtitle: "Dietary preferences and allergies shape your recipes and pod fit." },
  { key: "social", title: "Who are you comfortable meeting?", subtitle: "Trust level shapes pod matching." },
  { key: "matching", title: "What kind of pod works best for you?", subtitle: "Budget, geography, and support style all affect matching." },
  { key: "hosting", title: "What can your home realistically support?", subtitle: "Hosting details keep the pod practical, not aspirational." },
  { key: "logistics", title: "What logistics should we know?", subtitle: "Hosting, car access, and groceries matter." },
];

const recipeCatalog: Record<string, { tags: string[]; warnings: string[] }> = {
  "Lemon chicken bowls": {
    tags: ["High protein", "Meal prep"],
    warnings: ["Contains chicken"],
  },
  "Sheet-pan fajitas": {
    tags: ["Fast cleanup", "Flexible"],
    warnings: [],
  },
  "Serious Eats-style baked ziti + roasted broccoli": {
    tags: ["Comfort food", "Good leftovers"],
    warnings: ["Contains dairy", "Contains gluten"],
  },
  "Chickpea shawarma bowls": {
    tags: ["Vegetarian", "Meal prep", "High protein"],
    warnings: [],
  },
  "Coconut lentil curry": {
    tags: ["Vegan", "Dairy-free", "Budget-friendly"],
    warnings: [],
  },
  "Mushroom miso noodles": {
    tags: ["Vegetarian", "Comfort food"],
    warnings: ["Contains gluten", "Contains soy"],
  },
  "Roasted veggie pesto pasta": {
    tags: ["Vegetarian", "Good leftovers"],
    warnings: ["Contains dairy", "Contains gluten"],
  },
  "Black bean taco meal prep": {
    tags: ["Vegetarian", "Meal prep", "Budget-friendly"],
    warnings: [],
  },
  "Tofu rice bowls with sesame greens": {
    tags: ["Vegan", "High protein"],
    warnings: ["Contains soy"],
  },
  "Salmon rice bowls": {
    tags: ["Pescatarian", "High protein", "Meal prep"],
    warnings: ["Contains fish"],
  },
  "Shrimp orzo skillet": {
    tags: ["Pescatarian", "Fast dinner"],
    warnings: ["Contains shellfish", "Contains gluten"],
  },
  "Mediterranean tuna couscous": {
    tags: ["Pescatarian", "Lunch-friendly"],
    warnings: ["Contains fish", "Contains gluten"],
  },
  "Dairy-free butter chicken": {
    tags: ["Chicken only", "Dairy-free", "Meal prep"],
    warnings: ["Contains chicken"],
  },
  "Lemon herb chicken and potatoes": {
    tags: ["Chicken only", "Classic", "One-pan"],
    warnings: ["Contains chicken"],
  },
  "Chicken lettuce wraps": {
    tags: ["Chicken only", "Low-carb"],
    warnings: ["Contains chicken", "Contains soy"],
  },
  "Gluten-free turkey chili": {
    tags: ["Gluten-free", "Meal prep", "High protein"],
    warnings: [],
  },
  "Stuffed sweet potatoes with black beans": {
    tags: ["Vegetarian", "Gluten-free", "Budget-friendly"],
    warnings: [],
  },
  "Dairy-free mushroom risotto": {
    tags: ["Vegetarian", "Dairy-free"],
    warnings: [],
  },
  "Halal chicken rice bowls": {
    tags: ["Halal", "Chicken only", "Meal prep"],
    warnings: ["Contains chicken"],
  },
  "Vegan peanut-free soba salad": {
    tags: ["Vegan", "Dairy-free"],
    warnings: ["Contains gluten", "Contains soy"],
  },
  "Pescatarian tomato cod stew": {
    tags: ["Pescatarian", "Dairy-free"],
    warnings: ["Contains fish"],
  },
  "Vegetarian enchilada bake": {
    tags: ["Vegetarian", "Comfort food", "Good leftovers"],
    warnings: ["Contains dairy"],
  },
  "Spinach ricotta stuffed shells": {
    tags: ["Vegetarian", "Crowd-pleaser"],
    warnings: ["Contains dairy", "Contains gluten"],
  },
  "Paneer tikka bowls": {
    tags: ["Vegetarian", "High protein", "Meal prep"],
    warnings: ["Contains dairy"],
  },
  "Eggplant parmesan bake": {
    tags: ["Vegetarian", "Comfort food"],
    warnings: ["Contains dairy", "Contains gluten", "Contains eggs"],
  },
  "Vegan chili with cornbread": {
    tags: ["Vegan", "Meal prep", "Budget-friendly"],
    warnings: [],
  },
  "Thai coconut tofu soup": {
    tags: ["Vegan", "Dairy-free", "Comfort food"],
    warnings: ["Contains soy"],
  },
  "Cauliflower chickpea tikka masala": {
    tags: ["Vegan", "Dairy-free", "Meal prep"],
    warnings: [],
  },
  "Roasted veggie quinoa bowls": {
    tags: ["Vegan", "Gluten-free", "Meal prep"],
    warnings: [],
  },
  "Pesto salmon with potatoes": {
    tags: ["Pescatarian", "One-pan", "High protein"],
    warnings: ["Contains fish", "Contains dairy"],
  },
  "Miso glazed salmon bowls": {
    tags: ["Pescatarian", "Meal prep"],
    warnings: ["Contains fish", "Contains soy"],
  },
  "Garlic shrimp rice bowls": {
    tags: ["Pescatarian", "High protein", "Fast dinner"],
    warnings: ["Contains shellfish"],
  },
  "Mediterranean baked cod": {
    tags: ["Pescatarian", "Dairy-free", "One-pan"],
    warnings: ["Contains fish"],
  },
  "Chicken shawarma sheet pan": {
    tags: ["Chicken only", "Meal prep", "High protein"],
    warnings: ["Contains chicken"],
  },
  "Chicken burrito bowls": {
    tags: ["Chicken only", "Meal prep", "Good leftovers"],
    warnings: ["Contains chicken"],
  },
  "Lemon garlic chicken pasta": {
    tags: ["Chicken only", "Comfort food"],
    warnings: ["Contains chicken", "Contains dairy", "Contains gluten"],
  },
  "Greek chicken meatballs": {
    tags: ["Chicken only", "High protein"],
    warnings: ["Contains chicken", "Contains dairy", "Contains eggs"],
  },
  "Halal chicken kofta bowls": {
    tags: ["Halal", "Chicken only", "Meal prep"],
    warnings: ["Contains chicken"],
  },
  "Halal lamb rice platters": {
    tags: ["Halal", "High protein", "Dinner party"],
    warnings: ["Contains red meat"],
  },
  "Turkey meatball marinara": {
    tags: ["Non-vegetarian", "Meal prep"],
    warnings: ["Contains dairy", "Contains gluten", "Contains eggs"],
  },
  "Beef and broccoli rice bowls": {
    tags: ["Non-vegetarian", "High protein"],
    warnings: ["Contains red meat", "Contains soy"],
  },
  "Beef taco skillet": {
    tags: ["Non-vegetarian", "Fast dinner"],
    warnings: ["Contains red meat"],
  },
  "Dairy-free turkey meat sauce": {
    tags: ["Non-vegetarian", "Dairy-free", "Meal prep"],
    warnings: ["Contains gluten"],
  },
  "Gluten-free veggie fried rice": {
    tags: ["Vegetarian", "Gluten-free", "Fast dinner"],
    warnings: ["Contains eggs", "Contains soy"],
  },
  "Dairy-free chickpea pasta primavera": {
    tags: ["Vegetarian", "Dairy-free", "Good leftovers"],
    warnings: ["Contains gluten"],
  },
  "Nut-free sesame tofu bowls": {
    tags: ["Vegan", "Nut-free", "Meal prep"],
    warnings: ["Contains soy"],
  },
  "Egg-free roasted tomato gnocchi": {
    tags: ["Vegetarian", "Egg-free", "Comfort food"],
    warnings: ["Contains dairy", "Contains gluten"],
  },
};

const baseRecipeSeed = Object.keys(recipeCatalog).map((title) => ({
  title,
  description: recipeCatalog[title].tags.join(" • "),
}));

export default function Home() {
  const [supabase] = useState(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  });

  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [quizStep, setQuizStep] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const [pod, setPod] = useState<Pod | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [recipeOptions, setRecipeOptions] = useState<RecipeOption[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [podMembers, setPodMembers] = useState<PodMember[]>([]);
  const [podMemberProfiles, setPodMemberProfiles] = useState<PodMemberProfile[]>([]);
  const [demandProfiles, setDemandProfiles] = useState<Profile[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackNotes, setFeedbackNotes] = useState("Strong value, solid leftovers, and easy cleanup.");
  const [anonymousPodFeedback, setAnonymousPodFeedback] = useState("One person carried cleanup. Task balancing should be more explicit next time.");
  const [activeTab, setActiveTab] = useState<"home" | "recipes" | "tasks" | "chat">("home");
  const [mealMode, setMealMode] = useState("Meal prep");
  const [menuType, setMenuType] = useState("Main + dessert");
  const [matchConnectionPreference, setMatchConnectionPreference] = useState(connectionPreferenceOptions[0]);
  const [budgetPreference, setBudgetPreference] = useState(budgetOptions[1]);
  const [travelPreference, setTravelPreference] = useState(geographyOptions[1]);
  const [supportStyle, setSupportStyle] = useState(supportStyleOptions[1]);
  const [vacuumAvailable, setVacuumAvailable] = useState(false);
  const [paperPlatesReady, setPaperPlatesReady] = useState(false);
  const [fridgeSpace, setFridgeSpace] = useState("Standard fridge space");
  const [cleanupInstructions, setCleanupInstructions] = useState("Shoes by the door. Wipe counters before leaving.");
  const [supportNeeds, setSupportNeeds] = useState<string[]>([]);
  const [receiptName, setReceiptName] = useState("");
  const [grocerySpend, setGrocerySpend] = useState(68);
  const [splitwiseReady, setSplitwiseReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const loadAppData = useCallback(async (userId: string) => {
    if (!supabase) return;

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const nextProfile = (profileData as Profile | null) ?? null;
    setProfile(nextProfile);
    setDisplayName(nextProfile?.display_name ?? "");
    setOnboardingDone(Boolean(nextProfile?.onboarding_completed));

    const { data: membership } = await supabase
      .from("pod_members")
      .select("pod_id, pods(*)")
      .eq("user_id", userId)
      .maybeSingle();

    const currentPod = membership?.pods as Pod | undefined;
    setPod(currentPod ?? null);

    if (!currentPod) {
      setMemberCount(0);
      setPodMembers([]);
      setPodMemberProfiles([]);
      setRecipeOptions([]);
      setSelectedRecipeId(null);
      setTasks([]);
      setMessages([]);
    }

    const { data: friendLinks } = await supabase.from("friend_connections").select("friend_id").eq("user_id", userId);
    const friendIds = (friendLinks ?? []).map((link) => link.friend_id);

    if (friendIds.length) {
      const { data: friendProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", friendIds)
        .order("display_name");
      setFriends((friendProfiles as FriendProfile[]) ?? []);
    } else {
      setFriends([]);
    }

    const [profilesResponse, allMembershipsResponse] = await Promise.all([
      supabase.from("profiles").select("*").eq("onboarding_completed", true),
      supabase.from("pod_members").select("user_id"),
    ]);

    const assignedUserIds = new Set((allMembershipsResponse.data ?? []).map((member) => member.user_id));
    const pool = ((profilesResponse.data as Profile[]) ?? []).filter((candidate) => {
      if (candidate.id === userId) return true;
      return !assignedUserIds.has(candidate.id);
    });
    setDemandProfiles(pool);

    if (!currentPod) {
      return;
    }

    const existingRecipes = await supabase.from("recipe_options").select("id, title, description").eq("pod_id", currentPod.id);
    const existingTitles = new Set((existingRecipes.data ?? []).map((recipe) => recipe.title));
    const missingRecipes = baseRecipeSeed.filter((recipe) => !existingTitles.has(recipe.title));

    if (missingRecipes.length > 0) {
      await supabase.from("recipe_options").insert(
        missingRecipes.map((recipe) => ({
          pod_id: currentPod.id,
          title: recipe.title,
          description: recipe.description,
        })),
      );
    }

    const [membersResponse, recipeResponse, voteResponse, taskResponse, feedbackResponse, messageResponse] =
      await Promise.all([
        supabase.from("pod_members").select("user_id, connection_type, role").eq("pod_id", currentPod.id),
        supabase.from("recipe_options").select("*").eq("pod_id", currentPod.id),
        supabase.from("recipe_votes").select("*").eq("pod_id", currentPod.id).eq("user_id", userId).maybeSingle(),
        supabase.from("tasks").select("*").eq("pod_id", currentPod.id).order("created_at"),
        supabase.from("feedback").select("*").eq("pod_id", currentPod.id).eq("user_id", userId).maybeSingle(),
        supabase.from("pod_messages").select("*").eq("pod_id", currentPod.id).order("created_at"),
      ]);

    const memberRows = (membersResponse.data as PodMember[]) ?? [];
    setMemberCount(memberRows.length);
    setPodMembers(memberRows);
    setRecipeOptions((recipeResponse.data as RecipeOption[]) ?? []);
    setTasks((taskResponse.data as Task[]) ?? []);
    setMessages((messageResponse.data as Message[]) ?? []);

    if (memberRows.length) {
      const { data: memberProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, email, dietary_preferences, allergies")
        .in("id", memberRows.map((member) => member.user_id));
      setPodMemberProfiles((memberProfiles as PodMemberProfile[]) ?? []);
    } else {
      setPodMemberProfiles([]);
    }

    if (voteResponse.data) {
      setSelectedRecipeId(voteResponse.data.recipe_option_id);
      setMealMode(voteResponse.data.meal_mode);
      setMenuType(voteResponse.data.menu_type);
    }

    if (feedbackResponse.data) {
      setFeedbackRating(feedbackResponse.data.rating);
      setFeedbackNotes(feedbackResponse.data.notes || "");
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        await loadAppData(data.session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await loadAppData(nextSession.user.id);
      } else {
        setProfile(null);
        setPod(null);
        setPodMembers([]);
        setPodMemberProfiles([]);
        setDemandProfiles([]);
        setOnboardingDone(false);
        setFriends([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAppData, supabase]);

  const currentStep = quizSteps[quizStep];
  const progress = useMemo(() => ((quizStep + 1) / quizSteps.length) * 100, [quizStep]);

  async function withTimeout<T>(promise: PromiseLike<T>, message: string, timeoutMs = 12000): Promise<T> {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  }

  function updateProfileField<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((current) => {
      if (!current) return current;
      return { ...current, [field]: value };
    });
  }

  function toggleGoal(goal: string) {
    const currentGoals = new Set(profile?.goals ?? []);
    if (currentGoals.has(goal)) currentGoals.delete(goal);
    else currentGoals.add(goal);
    updateProfileField("goals", [...currentGoals]);
  }

  function toggleDietaryPreference(option: string) {
    const current = new Set(profile?.dietary_preferences ?? ["No preference"]);

    if (option === "No preference") {
      updateProfileField("dietary_preferences", ["No preference"]);
      return;
    }

    current.delete("No preference");
    if (current.has(option)) current.delete(option);
    else current.add(option);

    updateProfileField("dietary_preferences", current.size ? [...current] : ["No preference"]);
  }

  function toggleAllergy(option: string) {
    const current = new Set(profile?.allergies ?? []);
    if (current.has(option)) current.delete(option);
    else current.add(option);
    updateProfileField("allergies", [...current]);
  }

  function toggleSupportNeed(option: string) {
    setSupportNeeds((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setSaving(true);
    setStatusMessage("");

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      setStatusMessage(
        error
          ? error.message
          : "Account created. Check your email if you need to verify your account, then sign in to continue.",
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      setStatusMessage(error ? error.message : "Signed in.");
    }

    setSaving(false);
  }

  async function saveOnboarding() {
    if (!supabase || !session?.user) return;
    setSaving(true);
    setStatusMessage("");

    const payload = {
      id: session.user.id,
      email: session.user.email,
      display_name: displayName || session.user.email?.split("@")[0] || "friend",
      cooking_skill: profile?.cooking_skill || skillOptions[0],
      social_preference: profile?.social_preference || socialOptions[0],
      goals: profile?.goals?.length ? profile.goals : ["Save money", "Eat socially", "Meal prep"],
      dietary_preferences: profile?.dietary_preferences?.length ? profile.dietary_preferences : ["No preference"],
      allergies: profile?.allergies ?? [],
      grocery_distance_minutes: profile?.grocery_distance_minutes ?? 12,
      has_car: profile?.has_car ?? false,
      can_host: profile?.can_host ?? false,
      host_capacity: profile?.host_capacity ?? 0,
      dishwasher: profile?.dishwasher ?? false,
      utensils_ready: profile?.utensils_ready ?? true,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    try {
      const result = await withTimeout(
        supabase.from("profiles").upsert(payload),
        "Saving took too long. Please check your connection and try again.",
      );

      if (result.error) {
        setStatusMessage(result.error.message);
        return;
      }

      setOnboardingDone(true);
      setStatusMessage("Profile saved. You're ready to join your first pod.");
      await loadAppData(session.user.id);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "We couldn't save your onboarding right now.");
    } finally {
      setSaving(false);
    }
  }

  async function joinSuggestedPod() {
    if (!supabase || !session?.user) return;
    setSaving(true);
    const chosenPod = suggestedPod;

    let { data: demoPod } = await supabase.from("pods").select("*").eq("slug", chosenPod.slug).maybeSingle();

    if (!demoPod) {
      const created = await supabase
        .from("pods")
        .insert({
          slug: chosenPod.slug,
          name: chosenPod.name,
          meal_mode: chosenPod.meal_mode,
          menu_type: chosenPod.menu_type,
          portion_count: chosenPod.portion_count,
          host_notes: chosenPod.host_notes,
          created_by: session.user.id,
        })
        .select("*")
        .single();

      if (created.error) {
        setStatusMessage(created.error.message);
        setSaving(false);
        return;
      }

      demoPod = created.data;
    }

    const joined = await supabase.from("pod_members").upsert({
      pod_id: demoPod.id,
      user_id: session.user.id,
      role: "member",
      connection_type:
        matchConnectionPreference === "1st-degree friends"
          ? "first-degree"
          : matchConnectionPreference === "2nd-degree mutuals"
            ? "friend-of-a-friend"
            : "stranger",
    });

    setSaving(false);
    if (joined.error) {
      setStatusMessage(joined.error.message);
      return;
    }

    setStatusMessage(`You're in. ${chosenPod.name} is ready.`);
    await loadAppData(session.user.id);
  }

  async function selectRecipe(recipeId: string) {
    if (!supabase || !session?.user || !pod) return;
    setSelectedRecipeId(recipeId);
    const { error } = await supabase.from("recipe_votes").upsert({
      pod_id: pod.id,
      user_id: session.user.id,
      recipe_option_id: recipeId,
      meal_mode: mealMode,
      menu_type: menuType,
      updated_at: new Date().toISOString(),
    });
    if (error) setStatusMessage(error.message);
  }

  async function savePreferences(nextMealMode: string, nextMenuType: string) {
    if (!supabase || !session?.user || !pod || !selectedRecipeId) return;
    setMealMode(nextMealMode);
    setMenuType(nextMenuType);
    const { error } = await supabase.from("recipe_votes").upsert({
      pod_id: pod.id,
      user_id: session.user.id,
      recipe_option_id: selectedRecipeId,
      meal_mode: nextMealMode,
      menu_type: nextMenuType,
      updated_at: new Date().toISOString(),
    });
    if (error) setStatusMessage(error.message);
  }

  async function updatePortions(delta: number) {
    if (!supabase || !pod) return;
    const nextCount = Math.max(3, pod.portion_count + delta * 3);
    setPod({ ...pod, portion_count: nextCount });
    const { error } = await supabase.from("pods").update({ portion_count: nextCount }).eq("id", pod.id);
    if (error) setStatusMessage(error.message);
  }

  async function toggleTask(task: Task) {
    if (!supabase) return;
    const nextStatus = task.status === "done" ? "todo" : "done";
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    const { error } = await supabase.from("tasks").update({ status: nextStatus }).eq("id", task.id);
    if (error) setStatusMessage(error.message);
  }

  async function saveFeedback() {
    if (!supabase || !session?.user || !pod) return;
    const { error } = await supabase.from("feedback").upsert({
      pod_id: pod.id,
      user_id: session.user.id,
      rating: feedbackRating,
      notes: feedbackNotes,
      updated_at: new Date().toISOString(),
    });
    setStatusMessage(error ? error.message : "Feedback saved.");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user || !pod || !messageDraft.trim()) return;
    const body = messageDraft.trim();
    setMessageDraft("");
    const { error } = await supabase.from("pod_messages").insert({
      pod_id: pod.id,
      user_id: session.user.id,
      body,
    });
    if (error) {
      setStatusMessage(error.message);
      return;
    }
    await loadAppData(session.user.id);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setOnboardingDone(false);
    setQuizStep(0);
    setStatusMessage("Signed out.");
  }

  async function leaveCurrentPod() {
    if (!supabase || !session?.user || !pod) return;

    setStatusMessage("");
    const { error } = await supabase
      .from("pod_members")
      .delete()
      .eq("pod_id", pod.id)
      .eq("user_id", session.user.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setPod(null);
    setPodMembers([]);
    setPodMemberProfiles([]);
    setMemberCount(0);
    setRecipeOptions([]);
    setSelectedRecipeId(null);
    setTasks([]);
    setMessages([]);
    setStatusMessage("You left the pod. You can join again anytime.");
    await loadAppData(session.user.id);
  }

  async function addFriend() {
    if (!supabase || !session?.user) return;

    const normalizedEmail = friendEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatusMessage("Enter your friend's email to add them.");
      return;
    }

    if (normalizedEmail === session.user.email?.toLowerCase()) {
      setStatusMessage("You can't add yourself as a friend.");
      return;
    }

    const { data: friendProfile, error: friendLookupError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (friendLookupError) {
      setStatusMessage(friendLookupError.message);
      return;
    }

    if (!friendProfile) {
      setStatusMessage("That account hasn't joined yet. Ask them to sign up first.");
      return;
    }

    const existingFriend = friends.some((friend) => friend.id === friendProfile.id);
    if (existingFriend) {
      setStatusMessage("They're already in your network.");
      return;
    }

    const { error } = await supabase.from("friend_connections").insert({
      user_id: session.user.id,
      friend_id: friendProfile.id,
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setFriendEmail("");
    setStatusMessage("Friend added. You can now use this connection in pod selection.");
    await loadAppData(session.user.id);
  }

  async function removeFriend(friendId: string) {
    if (!supabase || !session?.user) return;

    const { error } = await supabase
      .from("friend_connections")
      .delete()
      .eq("user_id", session.user.id)
      .eq("friend_id", friendId);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage("Friend removed from your network.");
    await loadAppData(session.user.id);
  }

  function openProfileEditor() {
    setQuizStep(1);
    setOnboardingDone(false);
    setStatusMessage("Update your profile to refresh recipe and pod recommendations.");
  }

  const renderQuizStep = () => {
    if (!profile) return null;

    switch (currentStep.key) {
      case "intro":
        return (
          <div className={styles.stepContent}>
            <div className={styles.heroCard}>
              <h2>Meals are social, logistical, and energy decisions.</h2>
              <p>
                We’ll ask just enough to match you into the right pod, with the right people, for the right kind of meal.
              </p>
            </div>
          </div>
        );
      case "name":
        return (
          <div className={styles.stepContent}>
            <label className={styles.field}>
              <span>Display name</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ishita" />
            </label>
          </div>
        );
      case "skill":
        return (
          <div className={styles.stepContent}>
            <div className={styles.choiceColumn}>
              {skillOptions.map((option) => (
                <button
                  key={option}
                  className={profile.cooking_skill === option ? styles.selectedChoice : styles.choiceCard}
                  onClick={() => updateProfileField("cooking_skill", option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case "goals":
        return (
          <div className={styles.stepContent}>
            <div className={styles.tagGrid}>
              {goalOptions.map((goal) => (
                <button
                  key={goal}
                  className={profile.goals?.includes(goal) ? styles.selectedChip : styles.chip}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        );
      case "social":
        return (
          <div className={styles.stepContent}>
            <div className={styles.choiceColumn}>
              {socialOptions.map((option) => (
                <button
                  key={option}
                  className={profile.social_preference === option ? styles.selectedChoice : styles.choiceCard}
                  onClick={() => updateProfileField("social_preference", option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case "matching":
        return (
          <div className={styles.stepContent}>
            <div className={styles.infoCard}>
              <strong>Budget comfort</strong>
              <div className={styles.tagGrid}>
                {budgetOptions.map((option) => (
                  <button
                    key={option}
                    className={budgetPreference === option ? styles.selectedChip : styles.chip}
                    onClick={() => setBudgetPreference(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.infoCard}>
              <strong>Geography</strong>
              <div className={styles.tagGrid}>
                {geographyOptions.map((option) => (
                  <button
                    key={option}
                    className={travelPreference === option ? styles.selectedChip : styles.chip}
                    onClick={() => setTravelPreference(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.infoCard}>
              <strong>How do you want to contribute?</strong>
              <div className={styles.tagGrid}>
                {supportStyleOptions.map((option) => (
                  <button
                    key={option}
                    className={supportStyle === option ? styles.selectedChip : styles.chip}
                    onClick={() => setSupportStyle(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "hosting":
        return (
          <div className={styles.stepContent}>
            <div className={styles.tagGrid}>
              <button
                className={vacuumAvailable ? styles.selectedChip : styles.chip}
                onClick={() => setVacuumAvailable((current) => !current)}
              >
                Vacuum available
              </button>
              <button
                className={paperPlatesReady ? styles.selectedChip : styles.chip}
                onClick={() => setPaperPlatesReady((current) => !current)}
              >
                Paper plates ready
              </button>
            </div>
            <label className={styles.field}>
              <span>Fridge capacity for pod ingredients</span>
              <input value={fridgeSpace} onChange={(e) => setFridgeSpace(e.target.value)} placeholder="Standard fridge space" />
            </label>
            <label className={styles.field}>
              <span>Cleanup instructions for guests</span>
              <input
                value={cleanupInstructions}
                onChange={(e) => setCleanupInstructions(e.target.value)}
                placeholder="Stack plates by sink, wipe surfaces, take leftovers home."
              />
            </label>
          </div>
        );
      case "diet":
        return (
          <div className={styles.stepContent}>
            <div className={styles.infoCard}>
              <strong>Dietary preferences</strong>
              <div className={styles.tagGrid}>
                {dietaryPreferenceOptions.map((option) => (
                  <button
                    key={option}
                    className={profile.dietary_preferences?.includes(option) ? styles.selectedChip : styles.chip}
                    onClick={() => toggleDietaryPreference(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.infoCard}>
              <strong>Allergies or avoidances</strong>
              <div className={styles.tagGrid}>
                {allergyOptions.map((option) => (
                  <button
                    key={option}
                    className={profile.allergies?.includes(option) ? styles.selectedChip : styles.chip}
                    onClick={() => toggleAllergy(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "logistics":
        return (
          <div className={styles.stepContent}>
            <div className={styles.compactGrid}>
              <label className={styles.field}>
                <span>Walk to grocery store (minutes)</span>
                <input
                  type="number"
                  value={profile.grocery_distance_minutes ?? 12}
                  onChange={(e) => updateProfileField("grocery_distance_minutes", Number(e.target.value))}
                />
              </label>
              <label className={styles.field}>
                <span>Host capacity</span>
                <input
                  type="number"
                  value={profile.host_capacity ?? 0}
                  onChange={(e) => updateProfileField("host_capacity", Number(e.target.value))}
                />
              </label>
            </div>
            <div className={styles.tagGrid}>
              <button
                className={profile.has_car ? styles.selectedChip : styles.chip}
                onClick={() => updateProfileField("has_car", !profile.has_car)}
              >
                Car access
              </button>
              <button
                className={profile.can_host ? styles.selectedChip : styles.chip}
                onClick={() => updateProfileField("can_host", !profile.can_host)}
              >
                Can host
              </button>
              <button
                className={profile.dishwasher ? styles.selectedChip : styles.chip}
                onClick={() => updateProfileField("dishwasher", !profile.dishwasher)}
              >
                Dishwasher
              </button>
              <button
                className={profile.utensils_ready ? styles.selectedChip : styles.chip}
                onClick={() => updateProfileField("utensils_ready", !profile.utensils_ready)}
              >
                Full utensils
              </button>
            </div>
            <div className={styles.infoCard}>
              <strong>Support flags</strong>
              <div className={styles.tagGrid}>
                {supportNeedOptions.map((option) => (
                  <button
                    key={option}
                    className={supportNeeds.includes(option) ? styles.selectedChip : styles.chip}
                    onClick={() => toggleSupportNeed(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const recipeCards = useMemo(() => {
    const preferences = new Set(profile?.dietary_preferences ?? ["No preference"]);
    const allergies = new Set(profile?.allergies ?? []);

    return recipeOptions
      .map((recipe) => {
        const meta = recipeCatalog[recipe.title] ?? { tags: [], warnings: [] };
        const warnings = [...meta.warnings];

        if (preferences.has("Vegetarian") && warnings.includes("Contains chicken")) {
          warnings.push("Not vegetarian");
        }
        if (preferences.has("Vegetarian") && warnings.includes("Contains fish")) {
          warnings.push("Not vegetarian");
        }
        if (preferences.has("Vegan") && (warnings.includes("Contains chicken") || warnings.includes("Contains dairy"))) {
          warnings.push("Not vegan");
        }
        if (preferences.has("Vegan") && warnings.includes("Contains fish")) {
          warnings.push("Not vegan");
        }
        if (preferences.has("Pescatarian") && warnings.includes("Contains chicken")) {
          warnings.push("Not pescatarian");
        }
        if (preferences.has("Pescatarian") && warnings.includes("Contains red meat")) {
          warnings.push("Not pescatarian");
        }
        if (preferences.has("Avoid red meat") && warnings.includes("Contains red meat")) {
          warnings.push("Includes red meat");
        }
        if (preferences.has("Gluten-free") && warnings.includes("Contains gluten")) {
          warnings.push("Not gluten-free");
        }
        if (preferences.has("Dairy-free") && warnings.includes("Contains dairy")) {
          warnings.push("Not dairy-free");
        }
        if (preferences.has("Halal") && recipe.title === "Lemon chicken bowls") {
          warnings.push("Not marked halal");
        }
        if (preferences.has("Halal") && meta.tags.includes("Non-vegetarian") && !meta.tags.includes("Halal")) {
          warnings.push("Not marked halal");
        }
        if (allergies.has("Nuts") && warnings.includes("Contains nuts")) {
          warnings.push("Conflicts with nut allergy");
        }
        if (allergies.has("Eggs") && warnings.includes("Contains eggs")) {
          warnings.push("Conflicts with egg allergy");
        }
        if (allergies.has("Dairy") && warnings.includes("Contains dairy")) {
          warnings.push("Conflicts with dairy allergy");
        }
        if (allergies.has("Gluten") && warnings.includes("Contains gluten")) {
          warnings.push("Conflicts with gluten allergy");
        }
        if (allergies.has("Shellfish") && warnings.includes("Contains shellfish")) {
          warnings.push("Conflicts with shellfish allergy");
        }
        if (allergies.has("Soy") && warnings.includes("Contains soy")) {
          warnings.push("Conflicts with soy allergy");
        }

        const compatible = warnings.length === 0;
        return {
          ...recipe,
          compatible,
          tags: meta.tags,
          warning: warnings[0] ?? null,
        };
      })
      .sort((a, b) => Number(b.compatible) - Number(a.compatible));
  }, [profile?.allergies, profile?.dietary_preferences, recipeOptions]);

  const connectionBreakdown = useMemo(() => {
    const counts = { first: 0, second: 0, stranger: 0 };
    podMembers
      .filter((member) => member.user_id !== session?.user?.id)
      .forEach((member) => {
      if (member.connection_type === "first-degree") counts.first += 1;
      else if (member.connection_type === "friend-of-a-friend") counts.second += 1;
      else counts.stranger += 1;
      });
    return counts;
  }, [podMembers, session?.user?.id]);

  const anonymousRestrictionSummary = useMemo(() => {
    const preferenceCounts = new Map<string, number>();
    const allergyCounts = new Map<string, number>();

    podMemberProfiles.forEach((member) => {
      (member.dietary_preferences ?? []).forEach((preference) => {
        if (preference !== "No preference") {
          preferenceCounts.set(preference, (preferenceCounts.get(preference) ?? 0) + 1);
        }
      });
      (member.allergies ?? []).forEach((allergy) => {
        allergyCounts.set(allergy, (allergyCounts.get(allergy) ?? 0) + 1);
      });
    });

    const summary = [
      ...[...preferenceCounts.entries()].map(([label, count]) => `${count} pod member${count > 1 ? "s" : ""} prefer ${label.toLowerCase()}`),
      ...[...allergyCounts.entries()].map(([label, count]) => `${count} pod member${count > 1 ? "s" : ""} avoid ${label.toLowerCase()}`),
    ];

    return summary.length ? summary : ["No anonymous restrictions submitted yet."];
  }, [podMemberProfiles]);

  const accountability = useMemo(() => {
    const doneCount = tasks.filter((task) => task.status === "done").length;
    const completion = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
    const needsSupport = supportNeeds.length > 0 || completion < 50;

    return {
      completion,
      doneCount,
      totalCount: tasks.length,
      needsSupport,
      note: needsSupport
        ? "Someone may need help with groceries, prep, or cleanup."
        : "The pod looks balanced right now.",
    };
  }, [supportNeeds, tasks]);

  const suggestedAssignments = useMemo(() => {
    const people = [
      displayName || session?.user?.email?.split("@")[0] || "You",
      ...friends.slice(0, 2).map((friend) => friend.display_name || friend.email || "Friend"),
    ];

    return tasks.map((task, index) => ({
      ...task,
      owner: people[index % Math.max(people.length, 1)] || "You",
    }));
  }, [displayName, friends, session?.user?.email, tasks]);

  const grocerySplit = useMemo(() => {
    const peopleCount = Math.max(memberCount, 1);
    return (grocerySpend / peopleCount).toFixed(2);
  }, [grocerySpend, memberCount]);

  const suggestedPod = useMemo<SuggestedPod>(() => {
    const selfProfile = profile;
    const selfGoals = new Set(selfProfile?.goals ?? []);
    const selfPrefs = new Set(selfProfile?.dietary_preferences ?? []);
    const friendIds = new Set(friends.map((friend) => friend.id));

    const rankedPool = demandProfiles
      .filter((candidate) => candidate.id !== selfProfile?.id)
      .map((candidate) => {
        let score = 0;
        if (friendIds.has(candidate.id)) score += 5;
        if (candidate.can_host && !selfProfile?.can_host) score += 2;
        if (candidate.has_car && !selfProfile?.has_car) score += 2;
        if (candidate.social_preference === selfProfile?.social_preference) score += 1;
        score += (candidate.goals ?? []).filter((goal) => selfGoals.has(goal)).length;
        score += (candidate.dietary_preferences ?? []).filter((preference) => selfPrefs.has(preference)).length;
        return { candidate, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.candidate);

    const podProfiles = [selfProfile, ...rankedPool].filter(Boolean) as Profile[];
    const mealPrepDemand = podProfiles.filter((candidate) => candidate.goals?.includes("Meal prep")).length;
    const socialDemand = podProfiles.filter((candidate) => candidate.goals?.includes("Eat socially")).length;
    const learnDemand = podProfiles.filter((candidate) => candidate.goals?.includes("Learn techniques")).length;
    const budgetDemand = podProfiles.filter((candidate) => candidate.goals?.includes("Save money") || candidate.goals?.includes("Stay on budget")).length;
    const strongDiet = podProfiles
      .flatMap((candidate) => candidate.dietary_preferences ?? [])
      .find((preference) => preference && preference !== "No preference");

    const host = podProfiles.find((candidate) => candidate.can_host);
    const podName =
      mealPrepDemand >= socialDemand && mealPrepDemand >= learnDemand
        ? budgetDemand > 0
          ? "Demand Pod: Smart Meal Prep"
          : "Demand Pod: Weeknight Prep"
        : socialDemand >= learnDemand
          ? "Demand Pod: Casual Supper"
          : "Demand Pod: Recipe Lab";

    const mealMode = mealPrepDemand >= socialDemand ? "Meal prep" : "One-and-done dinner";
    const menuType = socialDemand > mealPrepDemand ? "Main + dessert + drinks" : "Main + dessert";
    const tagSet = new Set<string>([
      mealMode,
      budgetDemand > 0 ? "Budget aware" : "Flexible spend",
      friendIds.size ? "Friend-weighted" : "Open connections",
      strongDiet || "Mixed diets",
    ]);
    const slug = `${podName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${mealMode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    return {
      slug,
      name: podName,
      description: `Generated from current signup demand across ${podProfiles.length} people with similar goals, logistics, and food preferences.`,
      meal_mode: mealMode,
      menu_type: menuType,
      portion_count: Math.max(6, podProfiles.length * 3),
      host_notes: host
        ? `${host.display_name || host.email || "A pod member"} can host${host.host_capacity ? ` for about ${host.host_capacity}` : ""}.`
        : "No host confirmed yet. This pod likely needs an external host or a member to opt in.",
      tags: [...tagSet],
      rationale: [
        `${rankedPool.length} other signed-up people fit your current profile`,
        friendIds.size ? `${friendIds.size} direct friend connection${friendIds.size === 1 ? "" : "s"} can influence matching` : "No direct friends yet, so matching leans on goals and logistics",
        strongDiet ? `Shared dietary signal detected: ${strongDiet}` : "No dominant diet signal yet",
        host ? "A likely host is available in the current demand pool" : "Hosting is the biggest current constraint",
      ],
    };
  }, [demandProfiles, friends, profile]);

  const podFitHighlights = [
    `${friends.length} direct friend${friends.length === 1 ? "" : "s"} in your network`,
    profile?.grocery_distance_minutes ? `${profile.grocery_distance_minutes} min from groceries` : "Grocery distance not set",
    profile?.can_host ? `Can host ${profile.host_capacity ?? 0}` : "Needs external host",
    profile?.has_car ? "Can support grocery runs" : "Needs a ride partner",
  ];

  if (!supabase) {
    return (
      <main className={styles.page}>
        <section className={styles.phoneFrame}>
          <div className={styles.centeredScreen}>
            <h1>App setup incomplete</h1>
            <p>This build is not fully configured yet.</p>
          </div>
        </section>
      </main>
    );
  }

  if (showSplash) {
    return (
      <main className={styles.page}>
        <section className={styles.phoneFrame}>
          <div className={styles.splashScreen}>
            <p className={styles.brandKicker}>More Than a Meal</p>
            <h1>More Than a Meal</h1>
            <p>Low-effort social meal prep for real life.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.phoneFrame}>
        <header className={styles.statusBar}>
          <span>9:41</span>
          <span>5G 84%</span>
        </header>

        {loading ? (
          <div className={styles.centeredScreen}>
            <p>Loading your pod...</p>
          </div>
        ) : !session ? (
          <div className={styles.screenBody}>
            <div className={styles.screenHeader}>
              <p className={styles.brandKicker}>More Than a Meal</p>
              <h2>Welcome</h2>
              <p>Start with an account, then we’ll guide you through onboarding.</p>
            </div>

            <form className={styles.authCard} onSubmit={handleAuthSubmit}>
              <div className={styles.authToggle}>
                <button
                  type="button"
                  className={authMode === "signup" ? styles.activeMode : ""}
                  onClick={() => setAuthMode("signup")}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  className={authMode === "signin" ? styles.activeMode : ""}
                  onClick={() => setAuthMode("signin")}
                >
                  Sign in
                </button>
              </div>

              <label className={styles.field}>
                <span>Email</span>
                <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              <label className={styles.field}>
                <span>Password</span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>

              <button className={styles.primaryButton} disabled={saving}>
                {saving ? "Working..." : authMode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className={styles.statusMessage}>{statusMessage}</p>
          </div>
        ) : !onboardingDone ? (
          <div className={styles.screenBody}>
            <div className={styles.progressBlock}>
              <div className={styles.progressLabelRow}>
                <span>Step {quizStep + 1}</span>
                <span>{quizSteps.length}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={styles.screenHeader}>
              <p className={styles.brandKicker}>Onboarding</p>
              <h2>{currentStep.title}</h2>
              <p>{currentStep.subtitle}</p>
            </div>

            {renderQuizStep()}

            <div className={styles.footerActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setQuizStep((step) => Math.max(0, step - 1))}
                disabled={quizStep === 0}
              >
                Back
              </button>
              {quizStep < quizSteps.length - 1 ? (
                <button className={styles.primaryButton} onClick={() => setQuizStep((step) => Math.min(quizSteps.length - 1, step + 1))}>
                  Next
                </button>
              ) : (
                <button className={styles.primaryButton} onClick={saveOnboarding} disabled={saving}>
                  {saving ? "Saving..." : "Finish onboarding"}
                </button>
              )}
            </div>
          </div>
        ) : !pod ? (
          <div className={styles.screenBody}>
            <div className={styles.screenHeader}>
              <p className={styles.brandKicker}>Ready to match</p>
              <h2>Choose a pod to join</h2>
              <p>Your onboarding profile is saved. Compare the pod options below, then join the one that fits best.</p>
            </div>

            <div className={styles.heroCard}>
              <h3>{suggestedPod.name}</h3>
              <p>{suggestedPod.description}</p>
              <div className={styles.recipeMeta}>
                {suggestedPod.tags.map((tag) => (
                  <span key={tag} className={styles.metaPill}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.infoCard}>
              <strong>Connection preference</strong>
              <div className={styles.tagGrid}>
                {connectionPreferenceOptions.map((option) => (
                  <button
                    key={option}
                    className={matchConnectionPreference === option ? styles.selectedChip : styles.chip}
                    onClick={() => setMatchConnectionPreference(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.infoCard}>
              <strong>Suggested pod</strong>
              <p>{suggestedPod.name}</p>
              <p className={styles.helperText}>
                {suggestedPod.meal_mode} • {suggestedPod.menu_type} • {suggestedPod.portion_count} portions
              </p>
              <p className={styles.helperText}>
                Host notes preview: {suggestedPod.host_notes}
              </p>
            </div>

            <div className={styles.infoCard}>
              <strong>Why this pod was generated</strong>
              <div className={styles.bulletColumn}>
                {suggestedPod.rationale.map((reason) => (
                  <p key={reason} className={styles.helperText}>
                    {reason}
                  </p>
                ))}
              </div>
            </div>

            <div className={styles.infoCard}>
              <strong>Why this pod fits you</strong>
              <div className={styles.bulletColumn}>
                {podFitHighlights.map((highlight) => (
                  <div key={highlight} className={styles.inlineStat}>
                    <span className={styles.metaPill}>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className={styles.primaryButton} onClick={joinSuggestedPod} disabled={saving}>
              {saving ? "Joining..." : "Create or join this pod"}
            </button>
            <button className={styles.secondaryButton} onClick={signOut}>
              Sign out
            </button>
            <p className={styles.statusMessage}>{statusMessage}</p>
          </div>
        ) : (
          <div className={styles.appView}>
            <div className={styles.appHeader}>
              <div>
                <p className={styles.brandKicker}>Pod 04</p>
                <h2>{pod.name}</h2>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.ghostButton} onClick={openProfileEditor}>
                  Edit profile
                </button>
                <button className={styles.iconButton} onClick={signOut}>
                  Sign out
                </button>
              </div>
            </div>

            <div className={styles.mobileTabs}>
              {[
                ["home", "Home"],
                ["recipes", "Recipes"],
                ["tasks", "Tasks"],
                ["chat", "Chat"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={activeTab === key ? styles.activeMobileTab : ""}
                  onClick={() => setActiveTab(key as "home" | "recipes" | "tasks" | "chat")}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.screenBody}>
              {activeTab === "home" && (
                <>
                  <div className={styles.heroCard}>
                    <p className={styles.cardKicker}>This week</p>
                    <h3>{pod.name}</h3>
                    <p>{memberCount} members • {pod.portion_count} portions • {mealMode}</p>
                  </div>
                  <div className={styles.infoCard}>
                    <strong>Pod status</strong>
                    <p className={styles.helperText}>
                      You’re already in this pod, so the separate `Join pod` screen is hidden.
                    </p>
                    <button className={styles.secondaryButton} onClick={leaveCurrentPod}>
                      Leave pod
                    </button>
                  </div>
                  <div className={styles.infoCard}>
                    <strong>Host notes</strong>
                    {memberCount <= 1 ? (
                      <>
                        <p>No host is confirmed yet.</p>
                        <p className={styles.helperText}>
                          Host notes will appear after the pod has at least one other member and someone confirms the hosting setup.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>{pod.host_notes || "No host notes yet."}</p>
                        <p className={styles.helperText}>
                          Cleanup: {cleanupInstructions}
                        </p>
                      </>
                    )}
                  </div>
                  <div className={styles.infoCard}>
                    <strong>Pod matchmaking</strong>
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>{connectionBreakdown.first}</span>
                        <span className={styles.statLabel}>1st-degree</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>{connectionBreakdown.second}</span>
                        <span className={styles.statLabel}>2nd-degree</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>{connectionBreakdown.stranger}</span>
                        <span className={styles.statLabel}>New people</span>
                      </div>
                    </div>
                    <p className={styles.helperText}>
                      Budget: {budgetPreference} • Geography: {travelPreference} • Support style: {supportStyle}
                    </p>
                  </div>
                  <div className={styles.infoCard}>
                    <strong>Your profile</strong>
                    <p>
                      {displayName || session.user.email} • {profile?.cooking_skill} • {profile?.social_preference}
                    </p>
                    <p className={styles.helperText}>
                      Preferences: {(profile?.dietary_preferences ?? ["No preference"]).join(", ")}
                    </p>
                    <p className={styles.helperText}>
                      Allergies: {(profile?.allergies ?? []).length ? profile?.allergies?.join(", ") : "None added"}
                    </p>
                    <p className={styles.helperText}>
                      Hosting: {profile?.can_host ? `Host for ${profile?.host_capacity ?? 0}` : "Not hosting"} • {fridgeSpace}
                    </p>
                    <p className={styles.helperText}>
                      Cleanup support: {vacuumAvailable ? "Vacuum" : "No vacuum"} • {paperPlatesReady ? "Paper plates ready" : "Reusable only"}
                    </p>
                    <button className={styles.secondaryButton} onClick={openProfileEditor}>
                      Edit profile
                    </button>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Your network</strong>
                    <p className={styles.helperText}>
                      Add friends by email so future pod matching can prioritize people you already know.
                    </p>
                    <div className={styles.friendComposer}>
                      <input
                        value={friendEmail}
                        onChange={(event) => setFriendEmail(event.target.value)}
                        placeholder="friend@example.com"
                        type="email"
                      />
                      <button className={styles.primaryButton} onClick={addFriend}>
                        Add
                      </button>
                    </div>
                    {friends.length ? (
                      <div className={styles.friendList}>
                        {friends.map((friend) => (
                          <div key={friend.id} className={styles.friendRow}>
                            <div>
                              <strong>{friend.display_name || friend.email}</strong>
                              <p className={styles.helperText}>{friend.email}</p>
                            </div>
                            <button className={styles.secondaryButton} onClick={() => removeFriend(friend.id)}>
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.helperText}>No friends added yet.</p>
                    )}
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Overall tracker</strong>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${accountability.completion}%` }} />
                    </div>
                    <p className={styles.helperText}>
                      Pod accountability is at {accountability.completion}%. {accountability.note}
                    </p>
                    {supportNeeds.length ? (
                      <div className={styles.tagGrid}>
                        {supportNeeds.map((need) => (
                          <span key={need} className={styles.warningBadge}>
                            {need}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Pilot opportunities</strong>
                    <p className={styles.helperText}>
                      Potential revenue tests: Splitwise sync for shared costs, grocery receipt verification, and affiliate add-ons like thermometers or prep kits.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "recipes" && (
                <>
                  <div className={styles.infoCard}>
                    <strong>Anonymous pod restrictions</strong>
                    <div className={styles.bulletColumn}>
                      {anonymousRestrictionSummary.map((item) => (
                        <p key={item} className={styles.helperText}>
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Recipe vote</strong>
                    <p className={styles.helperText}>
                      Ranked using your dietary preferences and allergy profile.
                    </p>
                    <div className={styles.choiceColumn}>
                      {recipeCards.map((recipe) => (
                        <button
                          key={recipe.id}
                          className={selectedRecipeId === recipe.id ? styles.selectedChoice : styles.choiceCard}
                          onClick={() => selectRecipe(recipe.id)}
                        >
                          <span>{recipe.title}</span>
                          <small>{recipe.description}</small>
                          <div className={styles.recipeMeta}>
                            <span className={recipe.compatible ? styles.goodBadge : styles.warningBadge}>
                              {recipe.compatible ? "Matches your profile" : "Check restrictions"}
                            </span>
                            {recipe.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className={styles.metaPill}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          {recipe.warning ? <div className={styles.warningText}>{recipe.warning}</div> : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Meal style</strong>
                    <p className={styles.helperText}>
                      This should reflect your restrictions too, not just pod convenience.
                    </p>
                    <div className={styles.tagGrid}>
                      {["Meal prep", "One-and-done dinner"].map((mode) => (
                        <button
                          key={mode}
                          className={mealMode === mode ? styles.selectedChip : styles.chip}
                          onClick={() => savePreferences(mode, menuType)}
                        >
                          {mode}
                        </button>
                      ))}
                      {courseOptions.map((type) => (
                        <button
                          key={type}
                          className={menuType === type ? styles.selectedChip : styles.chip}
                          onClick={() => savePreferences(mealMode, type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Portions</strong>
                    <div className={styles.stepperRow}>
                      <button className={styles.stepperButton} onClick={() => updatePortions(-1)}>-</button>
                      <span>{pod.portion_count} total portions</span>
                      <button className={styles.stepperButton} onClick={() => updatePortions(1)}>+</button>
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Your dietary profile</strong>
                    <p className={styles.helperText}>
                      Preferences: {(profile?.dietary_preferences ?? ["No preference"]).join(", ")}
                    </p>
                    <p className={styles.helperText}>
                      Allergies: {(profile?.allergies ?? []).length ? profile?.allergies?.join(", ") : "None added"}
                    </p>
                    <button className={styles.secondaryButton} onClick={openProfileEditor}>
                      Edit profile
                    </button>
                  </div>
                </>
              )}

              {activeTab === "tasks" && (
                <>
                  <div className={styles.infoCard}>
                    <strong>Accountability tracker</strong>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${accountability.completion}%` }} />
                    </div>
                    <p className={styles.helperText}>
                      {accountability.doneCount} of {accountability.totalCount} tasks completed. {accountability.note}
                    </p>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Assigned tasks</strong>
                    <div className={styles.choiceColumn}>
                      {suggestedAssignments.map((task) => (
                        <button
                          key={task.id}
                          className={task.status === "done" ? styles.selectedChoice : styles.choiceCard}
                          onClick={() => toggleTask(task)}
                        >
                          <span>{task.category}</span>
                          <small>{task.title}</small>
                          <small>Suggested owner: {task.owner}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Hosting + groceries</strong>
                    <div className={styles.bulletColumn}>
                      <p className={styles.helperText}>Dishwasher: {profile?.dishwasher ? "Yes" : "No"}</p>
                      <p className={styles.helperText}>Utensils: {profile?.utensils_ready ? "Ready" : "Need backup set"}</p>
                      <p className={styles.helperText}>Vacuum: {vacuumAvailable ? "Available" : "Not available"}</p>
                      <p className={styles.helperText}>Paper plates: {paperPlatesReady ? "Available" : "No"}</p>
                      <p className={styles.helperText}>Fridge: {fridgeSpace}</p>
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Receipt + cost tracking</strong>
                    <label className={styles.field}>
                      <span>Grocery total</span>
                      <input
                        type="number"
                        value={grocerySpend}
                        onChange={(event) => setGrocerySpend(Number(event.target.value))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Receipt upload</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? "")}
                      />
                    </label>
                    <p className={styles.helperText}>
                      {receiptName ? `Receipt attached: ${receiptName}` : "Take a picture of the receipt to cross-check against the recipe."}
                    </p>
                    <p className={styles.helperText}>
                      Estimated split: ${grocerySplit} per person.
                    </p>
                    <button className={styles.secondaryButton} onClick={() => setSplitwiseReady((current) => !current)}>
                      {splitwiseReady ? "Splitwise linked" : "Mark ready for Splitwise"}
                    </button>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Feedback</strong>
                    <div className={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          className={feedbackRating >= rating ? styles.activeRating : styles.rating}
                          onClick={() => setFeedbackRating(rating)}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className={styles.feedbackBox}
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                    />
                    <button className={styles.primaryButton} onClick={saveFeedback}>
                      Save feedback
                    </button>
                  </div>

                  <div className={styles.infoCard}>
                    <strong>Anonymous pod feedback</strong>
                    <textarea
                      className={styles.feedbackBox}
                      value={anonymousPodFeedback}
                      onChange={(event) => setAnonymousPodFeedback(event.target.value)}
                    />
                    <p className={styles.helperText}>
                      Use this for honest friction: someone loved the dish, someone else did not, or one member needed more support.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "chat" && (
                <>
                  <div className={styles.chatCard}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={message.user_id === session.user.id ? styles.outgoingMessage : styles.incomingMessage}
                      >
                        {message.body}
                      </div>
                    ))}
                  </div>
                  <form className={styles.messageComposer} onSubmit={sendMessage}>
                    <input
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      placeholder="Send a pod message"
                    />
                    <button className={styles.primaryButton}>Send</button>
                  </form>
                </>
              )}
              {statusMessage && activeTab === "home" ? <p className={styles.statusMessage}>{statusMessage}</p> : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
