export interface HFItem {
  id: string;
  author: string;
  downloads: number;
  likes: number;
  lastModified: string;
  tags: string[];
  private: boolean;
  cardData: {
    libraryName: string | null;
    task: string | null;
    description: string;
    sha: string;
  };
}

export interface HFSearchResponse {
  page: number;
  limit: number;
  total: number;
  items: HFItem[];
}

export async function hfSearch(params: {
  kind: 'models' | 'datasets' | 'tts';
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'downloads' | 'likes' | 'updated';
}): Promise<HFSearchResponse> {
  const queryParams = new URLSearchParams({
    kind: params.kind,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    sort: params.sort || 'downloads',
  });

  if (params.q && params.q.trim()) {
    queryParams.set('q', params.q.trim());
  }

  const response = await fetch(`/api/hf/search?${queryParams}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export function buildDownloadUrl(
  repoId: string, 
  revision: string, 
  path: string
): string {
  const encodedRepo = encodeURIComponent(repoId);
  const encodedRevision = encodeURIComponent(revision);
  const url = new URL(
    `/api/hf/download/${encodedRepo}/${encodedRevision}`, 
    window.location.origin
  );
  url.searchParams.set('path', path);
  return url.toString();
}
