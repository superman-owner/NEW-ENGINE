import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFlow } from '../../context/FlowContext';
import type { SavedProject } from '../../types/project';
import {
  getSavedProjects,
  deleteProject,
  duplicateProject,
  createNewBlankProject,
  setActiveProjectId,
  getActiveProjectId,
} from '../../services/projectService';
import { ConfirmDialog } from './ConfirmDialog';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  currentProjectName?: string;
}

type SortField = 'name' | 'modifiedAt' | 'size' | 'kind';
type SortOrder = 'asc' | 'desc';

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { nodes, edges, setNodes, setEdges, syncArchitectureToEngine } = useFlow();

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('modifiedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleProjectsUpdate = () => {
      const all = getSavedProjects();
      setProjects(all);
      const active = getActiveProjectId();
      setSelectedId(active || (all.length > 0 ? all[0].id : null));
    };

    if (isOpen) {
      handleProjectsUpdate();
    }

    window.addEventListener('fxforge-projects-updated', handleProjectsUpdate);
    return () => window.removeEventListener('fxforge-projects-updated', handleProjectsUpdate);
  }, [isOpen]);

  const handleLoad = (proj: SavedProject) => {
    if (proj.nodes && proj.nodes.length > 0) {
      setNodes(proj.nodes);
      setEdges(proj.edges || []);
      syncArchitectureToEngine(proj.nodes);
    }

    window.dispatchEvent(
      new CustomEvent('fxforge-load-blueprint', {
        detail: {
          nodes: proj.nodes && proj.nodes.length > 0 ? proj.nodes : nodes,
          edges: proj.edges || edges,
          name: proj.name,
        },
      })
    );

    setActiveProjectId(proj.id);
    setSelectedId(proj.id);
    onClose();
  };

  const handleNewBlankProject = () => {
    const newProj = createNewBlankProject();
    const updated = getSavedProjects();
    setProjects(updated);
    setSelectedId(newProj.id);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const updated = deleteProject(deleteConfirm.id);
    setProjects(updated);
    if (selectedId === deleteConfirm.id) {
      setSelectedId(updated.length > 0 ? updated[0].id : null);
    }
    setDeleteConfirm(null);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clone = duplicateProject(id);
    if (clone) {
      const updated = getSavedProjects();
      setProjects(updated);
      setSelectedId(clone.id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedProjects = useMemo(() => {
    let list = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.symbol && p.symbol.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'modifiedAt') {
        valA = a.modifiedAt || a.createdAt || '';
        valB = b.modifiedAt || b.createdAt || '';
      } else if (sortField === 'size') {
        valA = a.nodesCount || a.nodes?.length || 0;
        valB = b.nodesCount || b.nodes?.length || 0;
      } else if (sortField === 'kind') {
        valA = a.type || 'Deep RL Policy';
        valB = b.type || 'Deep RL Policy';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [projects, searchQuery, sortField, sortOrder]);

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === selectedId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '760px',
          maxWidth: '92vw',
          height: '460px',
          maxHeight: '88vh',
          borderRadius: '11px',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.18)' : '1px solid rgba(255, 255, 255, 0.16)',
          backgroundColor: isLight ? '#f6f6f6' : '#1e1e24',
          boxShadow: isLight
            ? '0 20px 60px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.1)'
            : '0 25px 80px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/*  macOS Finder Title Bar */}
        <div
          style={{
            height: '38px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.12)',
            backgroundColor: isLight ? '#eaeaea' : '#282830',
            flexShrink: 0,
            userSelect: 'none',
            fontFamily: 'var(--font-apple-text)',
          }}
        >
          {/* Left: Window Title & Strategy Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LucideIcons.Folder size={15} style={{ color: isLight ? '#0071e3' : '#0a84ff' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: isLight ? '#1d1d1f' : '#ffffff', letterSpacing: '-0.02em' }}>
              Load Project
            </span>
            <span
              style={{
                fontSize: '11px',
                color: isLight ? '#86868b' : 'rgba(255,255,255,0.5)',
                fontWeight: 500,
                fontFamily: 'var(--font-apple-numbers)',
              }}
            >
              ({projects.length} files)
            </span>
          </div>

          {/* Right: Search Input (Shifted to right position) */}
          <div style={{ position: 'relative', width: '210px' }}>
            <LucideIcons.Search
              size={12}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isLight ? '#8e8e93' : 'rgba(255,255,255,0.4)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              style={{
                width: '100%',
                height: '24px',
                paddingLeft: '26px',
                paddingRight: '8px',
                fontSize: '11.5px',
                borderRadius: '6px',
                border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.18)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
                color: isLight ? '#1d1d1f' : '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-apple-text)',
              }}
            />
          </div>
        </div>

        {/*  macOS Finder Column Header Bar */}
        <div
          style={{
            height: '24px',
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1fr) 140px 90px 130px 80px',
            alignItems: 'center',
            backgroundColor: isLight ? '#f0f0f0' : '#23232b',
            borderBottom: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.1)',
            fontSize: '11.5px',
            fontWeight: 600,
            color: isLight ? '#333333' : '#cccccc',
            userSelect: 'none',
            flexShrink: 0,
            fontFamily: 'var(--font-apple-text)',
            letterSpacing: '-0.01em',
          }}
        >
          {/* 1. Name */}
          <div
            onClick={() => handleSort('name')}
            style={{
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderRight: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
              height: '100%',
            }}
          >
            <span>Name</span>
            {sortField === 'name' && (
              <span style={{ fontSize: '9px', color: '#007aff' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
            )}
          </div>

          {/* 2. Date Modified */}
          <div
            onClick={() => handleSort('modifiedAt')}
            style={{
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderRight: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
              height: '100%',
            }}
          >
            <span>Date Modified</span>
            {sortField === 'modifiedAt' && (
              <span style={{ fontSize: '9px', color: '#007aff' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
            )}
          </div>

          {/* 3. Size */}
          <div
            onClick={() => handleSort('size')}
            style={{
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderRight: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
              height: '100%',
            }}
          >
            <span>Size</span>
            {sortField === 'size' && (
              <span style={{ fontSize: '9px', color: '#007aff' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
            )}
          </div>

          {/* 4. Kind */}
          <div
            onClick={() => handleSort('kind')}
            style={{
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderRight: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
              height: '100%',
            }}
          >
            <span>Kind</span>
            {sortField === 'kind' && (
              <span style={{ fontSize: '9px', color: '#007aff' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
            )}
          </div>

          {/* 5. Actions */}
          <div style={{ padding: '0 8px', textAlign: 'right', color: isLight ? '#86868b' : '#666666' }}>
            <span>Actions</span>
          </div>
        </div>

        {/*  macOS Finder File Rows (Clean Zebra Striped List) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: isLight ? '#ffffff' : '#181820',
          }}
        >
          {sortedProjects.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: isLight ? '#86868b' : '#666666', fontFamily: 'var(--font-apple-text)' }}>
              <LucideIcons.FileSearch size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4, display: 'block' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No Strategies Found</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.8 }}>
                Save strategies via the Top Navigation Bar or press Ctrl+S.
              </p>
            </div>
          ) : (
            sortedProjects.map((proj, idx) => {
              const isSelected = selectedId === proj.id;
              const isZebra = idx % 2 === 1;

              // Row background color based on zebra stripe and selection
              let rowBg = 'transparent';
              if (isSelected) {
                rowBg = isLight ? '#0071e3' : '#007aff';
              } else if (isZebra) {
                rowBg = isLight ? '#f9f9fb' : '#1c1c26';
              }

              const textColor = isSelected
                ? '#ffffff'
                : isLight
                ? '#1d1d1f'
                : '#e1e1e6';

              const secondaryColor = isSelected
                ? 'rgba(255, 255, 255, 0.8)'
                : isLight
                ? '#6e6e73'
                : '#86868b';

              const nodeCount = proj.nodesCount || proj.nodes?.length || 0;
              const estSize = `${Math.max(1, Math.round((JSON.stringify(proj).length) / 1024))} KB`;

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedId(proj.id)}
                  onDoubleClick={() => handleLoad(proj)}
                  style={{
                    height: '26px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(240px, 1fr) 140px 90px 130px 80px',
                    alignItems: 'center',
                    backgroundColor: rowBg,
                    color: textColor,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    transition: 'background-color 0.05s ease',
                  }}
                >
                  {/* Name Column with File Icon */}
                  <div
                    style={{
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-apple-text)',
                    }}
                  >
                    {/* macOS Document File Icon */}
                    <LucideIcons.FileCode2
                      size={14}
                      style={{
                        flexShrink: 0,
                        color: isSelected ? '#ffffff' : isLight ? '#0071e3' : '#0a84ff',
                      }}
                    />
                    <span style={{ fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {proj.name}
                    </span>
                  </div>

                  {/* Date Modified (Apple Typography) */}
                  <div
                    style={{
                      padding: '0 10px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: secondaryColor,
                      fontFamily: 'var(--font-apple-numbers)',
                      fontSize: '11.5px',
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {proj.modifiedAt || proj.createdAt || '--'}
                  </div>

                  {/* Size */}
                  <div
                    style={{
                      padding: '0 10px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: secondaryColor,
                      fontFamily: 'var(--font-apple-numbers)',
                      fontSize: '11.5px',
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {estSize} ({nodeCount}n)
                  </div>

                  {/* Kind */}
                  <div
                    style={{
                      padding: '0 10px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: secondaryColor,
                      fontFamily: 'var(--font-apple-text)',
                      fontSize: '11.5px',
                    }}
                  >
                    {proj.type || 'Deep RL Policy'}
                  </div>

                  {/* Inline Action Icons (Duplicate & Delete only) */}
                  <div
                    style={{
                      padding: '0 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '6px',
                    }}
                  >
                    {/* Duplicate Action */}
                    <button
                      onClick={(e) => handleDuplicate(proj.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isSelected ? 'rgba(255, 255, 255, 0.85)' : isLight ? '#6e6e73' : '#86868b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'color 0.15s ease, transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isLight ? '#111827' : '#ffffff';
                        e.currentTarget.style.transform = 'scale(1.22)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isSelected ? 'rgba(255, 255, 255, 0.85)' : isLight ? '#6e6e73' : '#86868b';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Duplicate Project (ทำซ้ำ)"
                    >
                      <LucideIcons.Copy size={12} />
                    </button>

                    {/* Delete Action */}
                    <button
                      onClick={(e) => handleDelete(proj.id, proj.name, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isSelected ? '#ffbaba' : '#ff453a',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'color 0.15s ease, transform 0.15s ease, filter 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ff3b30';
                        e.currentTarget.style.transform = 'scale(1.24)';
                        e.currentTarget.style.filter = 'drop-shadow(0 0 6px rgba(255, 69, 58, 0.85))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isSelected ? '#ffbaba' : '#ff453a';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.filter = 'none';
                      }}
                      title="Delete Project (ลบ)"
                    >
                      <LucideIcons.Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/*  macOS Open Dialog Footer Bar */}
        <div
          style={{
            height: '44px',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.12)',
            backgroundColor: isLight ? '#eaeaea' : '#282830',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {/* Left: New Blank Pipeline Button */}
          <button
            onClick={handleNewBlankProject}
            style={{
              height: '26px',
              padding: '0 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.18)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
              color: isLight ? '#1d1d1f' : '#ffffff',
              fontFamily: 'var(--font-apple-text)',
              transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isLight ? '#f5f5f7' : 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.boxShadow = isLight ? '0 2px 6px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isLight ? '#ffffff' : 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.18)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Create a new blank strategy without closing"
          >
            <LucideIcons.Plus size={12} />
            <span>New Blank Project</span>
          </button>

          {/* Right: Cancel & Open (Load) Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                height: '26px',
                padding: '0 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.18)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
                color: isLight ? '#1d1d1f' : '#ffffff',
                fontFamily: 'var(--font-apple-text)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#f5f5f7' : 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.boxShadow = isLight ? '0 2px 6px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#ffffff' : 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.18)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Cancel
            </button>

            <button
              disabled={!selectedProject}
              onClick={() => {
                if (selectedProject) {
                  handleLoad(selectedProject);
                }
              }}
              style={{
                height: '26px',
                padding: '0 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: selectedProject ? 'pointer' : 'not-allowed',
                opacity: selectedProject ? 1 : 0.4,
                border: 'none',
                backgroundColor: isLight ? '#0071e3' : '#007aff',
                color: '#ffffff',
                boxShadow: selectedProject ? '0 1px 4px rgba(0, 122, 255, 0.4)' : 'none',
                fontFamily: 'var(--font-apple-text)',
                transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (selectedProject) {
                  e.currentTarget.style.backgroundColor = isLight ? '#0077ed' : '#0a84ff';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(10, 132, 255, 0.65)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedProject) {
                  e.currentTarget.style.backgroundColor = isLight ? '#0071e3' : '#007aff';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 122, 255, 0.4)';
                }
              }}
            >
              Open
            </button>
          </div>
        </div>
      </div>

      {/*  In-App Confirmation Dialog for Project Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        type="danger"
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/*  In-App Alert Dialog for Errors */}
      <ConfirmDialog
        isOpen={Boolean(alertMessage)}
        type="warning"
        title="Notice"
        message={alertMessage || ''}
        confirmText="OK"
        onConfirm={() => setAlertMessage(null)}
      />
    </div>
  );
};

