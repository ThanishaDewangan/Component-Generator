export interface ScrapedPage {
  html: string;
  styles: string[];
  images: string[];
  title: string;
}

export interface Section {
  id: string;
  label: string;
  html: string;
}

export interface ScrapeResponse {
  html: string;
  styles: string[];
  images: string[];
  title: string;
}

export interface SectionsResponse {
  sections: Section[];
}

export interface GenerateResponse {
  code: string;
}

export interface RefineResponse {
  code: string;
}

export interface ApiError {
  error: string;
}

export interface SavedComponent {
  id: string;
  name: string;
  code: string;
  sectionLabel?: string;
  originalHtml?: string;
  styleVariant?: string;
  createdAt: number;
}
