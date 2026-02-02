import type { SavedComponent } from "@/types";

const STORAGE_KEY = "website-to-react-saved-components";

export function getSavedComponents(): SavedComponent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedComponent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveComponent(component: Omit<SavedComponent, "id" | "createdAt">): SavedComponent {
  const list = getSavedComponents();
  const item: SavedComponent = {
    ...component,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  list.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return item;
}

export function deleteSavedComponent(id: string): void {
  const list = getSavedComponents().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function searchSavedComponents(query: string): SavedComponent[] {
  const list = getSavedComponents();
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.sectionLabel?.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q)
  );
}
