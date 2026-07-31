export type UserApiKeys = {
  serpApiKey: string;
  geminiApiKey: string;
};

const STORAGE_KEY = "patentlens-user-api-keys";

export function loadUserApiKeys(): UserApiKeys {
  if (typeof window === "undefined") {
    return { serpApiKey: "", geminiApiKey: "" };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { serpApiKey: "", geminiApiKey: "" };
    const parsed = JSON.parse(raw) as Partial<UserApiKeys>;
    return {
      serpApiKey: typeof parsed.serpApiKey === "string" ? parsed.serpApiKey : "",
      geminiApiKey:
        typeof parsed.geminiApiKey === "string" ? parsed.geminiApiKey : "",
    };
  } catch {
    return { serpApiKey: "", geminiApiKey: "" };
  }
}

export function saveUserApiKeys(keys: UserApiKeys) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      serpApiKey: keys.serpApiKey.trim(),
      geminiApiKey: keys.geminiApiKey.trim(),
    })
  );
}

export function clearUserApiKeys() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasCompleteUserApiKeys(keys: UserApiKeys) {
  return Boolean(keys.serpApiKey.trim() && keys.geminiApiKey.trim());
}
