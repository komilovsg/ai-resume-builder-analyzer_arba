import { create } from "zustand";
import { generateUUID } from "./utils";

interface ResumeBuilderState {
  currentStep: number;
  resumeData: Partial<ResumeData>;
  isGenerating: boolean;
  generationError: string | null;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTitle: (title: string) => void;
  setAbout: (about: string) => void;
  setAboutRaw: (aboutRaw: string) => void;
  setPersonalInfo: (
    info: Partial<
      Pick<ResumeData, "fullName" | "location" | "email" | "phone" | "linkedin" | "telegram">
    >
  ) => void;
  addExperience: (experience: Omit<Experience, "id">) => void;
  updateExperience: (id: string, experience: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addLanguage: (language: Omit<Language, "id">) => void;
  removeLanguage: (id: string) => void;
  addRecommendation: (recommendation: Omit<Recommendation, "id">) => void;
  removeRecommendation: (id: string) => void;
  setStyle: (style: ResumeStyle) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | null) => void;
  reset: () => void;
  initializeResume: (id?: string) => void;
  hydrateResume: (resume: ResumeData) => void;
}

const STORAGE_KEY = "resume-builder-state";

const initialState: Partial<ResumeData> = {
  fullName: "",
  title: "",
  about: "",
  aboutRaw: "",
  location: "",
  email: "",
  phone: "",
  linkedin: "",
  telegram: "",
  experiences: [],
  skills: [],
  languages: [],
  recommendations: [],
  style: "modern",
};

// Load from localStorage
const loadFromStorage = (): Partial<ResumeBuilderState> => {
  if (typeof window === "undefined") return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        currentStep: parsed.currentStep || 1,
        resumeData: parsed.resumeData || initialState,
        isGenerating: false,
        generationError: null,
      };
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }
  return {};
};

// Debounced save to localStorage
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingState: Partial<ResumeBuilderState> | null = null;

const saveToStorage = (state: Partial<ResumeBuilderState>, getState?: () => ResumeBuilderState) => {
  if (typeof window === "undefined") return;
  
  // Store the latest state
  pendingState = state;
  
  // Clear previous timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Debounce saves - only save after 300ms of no changes (reduced for better UX)
  saveTimeout = setTimeout(() => {
    try {
      // Use the latest state or get from store
      const stateToSave = pendingState || (getState ? getState() : state);
      const toSave = {
        currentStep: stateToSave.currentStep,
        resumeData: stateToSave.resumeData,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      pendingState = null;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, 300);
};

const storedState = loadFromStorage();

export const useResumeStore = create<ResumeBuilderState>((set, get) => ({
  currentStep: storedState.currentStep || 1,
  resumeData: storedState.resumeData || initialState,
  isGenerating: false,
  generationError: null,

  setCurrentStep: (step: number) => {
    const newState = { currentStep: step };
    set(newState);
    saveToStorage({ ...get(), ...newState }, get);
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 6) {
      const newStep = currentStep + 1;
      const newState = { currentStep: newStep };
      set(newState);
      saveToStorage({ ...get(), ...newState }, get);
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      const newState = { currentStep: newStep };
      set(newState);
      saveToStorage({ ...get(), ...newState }, get);
    }
  },

  setTitle: (title: string) => {
    set((state) => {
      const newState = {
        resumeData: { ...state.resumeData, title },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  setAbout: (about: string) => {
    set((state) => {
      const newState = {
        resumeData: { ...state.resumeData, about },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  setAboutRaw: (aboutRaw: string) => {
    set((state) => {
      const newState = {
        resumeData: { ...state.resumeData, aboutRaw },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  setPersonalInfo: (info) => {
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          ...info,
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  addExperience: (experience: Omit<Experience, "id">) => {
    const newExperience: Experience = {
      ...experience,
      id: generateUUID(),
    };
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          experiences: [...(state.resumeData.experiences || []), newExperience],
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  updateExperience: (id: string, experience: Partial<Experience>) => {
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          experiences: (state.resumeData.experiences || []).map((exp) =>
            exp.id === id ? { ...exp, ...experience } : exp
          ),
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  removeExperience: (id: string) => {
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          experiences: (state.resumeData.experiences || []).filter(
            (exp) => exp.id !== id
          ),
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  addSkill: (skill: string) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;
    
    set((state) => {
      const skills = state.resumeData.skills || [];
      if (skills.includes(trimmedSkill)) return state;
      
      const newState = {
        resumeData: {
          ...state.resumeData,
          skills: [...skills, trimmedSkill],
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  removeSkill: (skill: string) => {
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          skills: (state.resumeData.skills || []).filter((s) => s !== skill),
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  addLanguage: (language: Omit<Language, "id">) => {
    const newLanguage: Language = {
      ...language,
      id: generateUUID(),
    };
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          languages: [...(state.resumeData.languages || []), newLanguage],
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  removeLanguage: (id: string) => {
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          languages: (state.resumeData.languages || []).filter(
            (lang) => lang.id !== id
          ),
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  addRecommendation: (recommendation: Omit<Recommendation, "id">) => {
    const newRecommendation: Recommendation = {
      ...recommendation,
      id: generateUUID(),
    };
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          recommendations: [
            ...(state.resumeData.recommendations || []),
            newRecommendation,
          ],
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  removeRecommendation: (id: string) => {
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          recommendations: (state.resumeData.recommendations || []).filter(
            (rec) => rec.id !== id
          ),
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  setStyle: (style: ResumeStyle) => {
    set((state) => {
      const newState = {
        resumeData: { ...state.resumeData, style },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  setGenerating: (isGenerating: boolean) => {
    set({ isGenerating });
  },

  setGenerationError: (error: string | null) => {
    set({ generationError: error });
  },

  reset: () => {
    const newState = {
      currentStep: 1,
      resumeData: initialState,
      isGenerating: false,
      generationError: null,
    };
    set(newState);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  initializeResume: (id?: string) => {
    const resumeId = id || generateUUID();
    const now = new Date().toISOString();
    set((state) => {
      const newState = {
        resumeData: {
          ...state.resumeData,
          id: resumeId,
          createdAt: now,
          updatedAt: now,
        },
      };
      saveToStorage({ ...get(), ...newState }, get);
      return newState;
    });
  },

  hydrateResume: (resume: ResumeData) => {
    const normalized: ResumeData = {
      ...initialState,
      ...resume,
      fullName: resume.fullName || "",
      location: resume.location || "",
      email: resume.email || "",
      phone: resume.phone || "",
      linkedin: resume.linkedin || "",
      telegram: resume.telegram || "",
      experiences: resume.experiences || [],
      skills: resume.skills || [],
      languages: resume.languages || [],
      recommendations: resume.recommendations || [],
      style: resume.style || "modern",
    };

    const newState = {
      currentStep: 1,
      resumeData: normalized,
      isGenerating: false,
      generationError: null,
    };

    set(newState);
    saveToStorage({ ...get(), ...newState }, get);
  },
}));

