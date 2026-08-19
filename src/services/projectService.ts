import type { SavedProject } from '../types/project';

const STORAGE_KEY = 'fxforge_saved_projects_v4';
const ACTIVE_PROJECT_KEY = 'fxforge_active_project_id_v4';

export function getSavedProjects(): SavedProject[] {
  try {
    // Clear legacy keys with mock data
    localStorage.removeItem('fxforge_saved_projects_v2');
    localStorage.removeItem('fxforge_saved_projects_v3');
    localStorage.removeItem('fxforge_active_project_id');

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load saved projects:', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
}

export function saveProjects(projects: SavedProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent('fxforge-projects-updated'));
  } catch (e) {
    console.error('Failed to persist projects:', e);
  }
}

export function deleteAllSavedProjects(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
    window.dispatchEvent(new CustomEvent('fxforge-projects-updated'));
  } catch (e) {
    console.error('Failed to clear saved projects:', e);
  }
}

export function getActiveProjectId(): string | null {
  try {
    const saved = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (saved) return saved;
    return null;
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch {}
}

export function saveCurrentProject(
  meta: {
    name: string;
    type?: SavedProject['type'];
    language?: SavedProject['language'];
    symbol?: string;
    timeframe?: string;
    description?: string;
  },
  currentNodes: any[],
  currentEdges: any[],
  spec?: any
): SavedProject {
  const projects = getSavedProjects();
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`;

  const existingIndex = projects.findIndex((p) => p.name.trim().toLowerCase() === meta.name.trim().toLowerCase());

  let project: SavedProject;

  if (existingIndex >= 0) {
    // Update existing project
    project = {
      ...projects[existingIndex],
      ...meta,
      nodesCount: currentNodes.length,
      modifiedAt: dateStr,
      nodes: currentNodes,
      edges: currentEdges,
      architectureSpec: spec,
    };
    projects[existingIndex] = project;
  } else {
    // Create new project ID
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const prefix = meta.language === 'MQL4' ? 'mt4' : 'mt5';
    const id = `${prefix}-${randomId}`;

    project = {
      id,
      name: meta.name,
      type: meta.type || 'Deep RL Policy',
      language: meta.language || 'MQL5',
      symbol: meta.symbol || spec?.symbol || 'XAUUSD',
      timeframe: meta.timeframe || spec?.timeframe || 'M15',
      nodesCount: currentNodes.length,
      createdAt: dateStr,
      modifiedAt: dateStr,
      description: meta.description || 'Custom Strategy DAG Pipeline built with FXFORGE Studio.',
      nodes: currentNodes,
      edges: currentEdges,
      architectureSpec: spec,
    };
    projects.unshift(project);
  }

  saveProjects(projects);
  setActiveProjectId(project.id);
  return project;
}

export function createNewBlankProject(preferredName?: string): SavedProject {
  const projects = getSavedProjects();
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`;

  let finalName = (preferredName || 'Untitled Project').trim();
  if (projects.some((p) => p.name.trim().toLowerCase() === finalName.toLowerCase())) {
    let counter = 2;
    while (projects.some((p) => p.name.trim().toLowerCase() === `${finalName} ${counter}`.toLowerCase())) {
      counter++;
    }
    finalName = `${finalName} ${counter}`;
  }

  const randomId = Math.floor(1000 + Math.random() * 9000);
  const newProj: SavedProject = {
    id: `mt5-${randomId}`,
    name: finalName,
    type: 'Deep RL Policy',
    language: 'MQL5',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    nodesCount: 0,
    createdAt: dateStr,
    modifiedAt: dateStr,
    description: 'New blank visual strategy canvas.',
    nodes: [],
    edges: [],
    architectureSpec: undefined,
  };

  projects.unshift(newProj);
  saveProjects(projects);
  setActiveProjectId(newProj.id);
  return newProj;
}

export function deleteProject(id: string): SavedProject[] {
  const projects = getSavedProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  return projects;
}

export function duplicateProject(id: string): SavedProject | null {
  const projects = getSavedProjects();
  const target = projects.find((p) => p.id === id);
  if (!target) return null;

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`;
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const prefix = target.language === 'MQL4' ? 'mt4' : 'mt5';

  const clone: SavedProject = {
    ...target,
    id: `${prefix}-${randomId}`,
    name: `${target.name} (Copy)`,
    createdAt: dateStr,
    modifiedAt: dateStr,
  };

  projects.unshift(clone);
  saveProjects(projects);
  return clone;
}

export function exportProjectToFile(project: SavedProject): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${project.id}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importProjectFromFile(file: File): Promise<SavedProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.name) {
          throw new Error('Invalid project file format (missing name)');
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`;
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const prefix = parsed.language === 'MQL4' ? 'mt4' : 'mt5';

        const imported: SavedProject = {
          id: parsed.id || `${prefix}-${randomId}`,
          name: parsed.name,
          type: parsed.type || 'Deep RL Policy',
          language: parsed.language || 'MQL5',
          symbol: parsed.symbol || 'XAUUSD',
          timeframe: parsed.timeframe || 'M15',
          nodesCount: Array.isArray(parsed.nodes) ? parsed.nodes.length : 0,
          createdAt: parsed.createdAt || dateStr,
          modifiedAt: dateStr,
          description: parsed.description || 'Imported FXFORGE Pipeline Project.',
          nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
          edges: Array.isArray(parsed.edges) ? parsed.edges : [],
          architectureSpec: parsed.architectureSpec,
        };

        const projects = getSavedProjects();
        projects.unshift(imported);
        saveProjects(projects);
        setActiveProjectId(imported.id);
        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
