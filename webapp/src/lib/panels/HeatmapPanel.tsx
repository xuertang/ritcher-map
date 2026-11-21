'use client';

import { useState } from 'react';
import type { HeatmapGroupResponse } from '../types';
import { FlameIcon } from '../ui/icons';
import { Chevron, ColorCheck } from './CategoryPanel';

export interface HeatmapPanelProps {
  groups: HeatmapGroupResponse[];
  /** Heatmap category ids currently ACTIVE (rendered); default is none. */
  active: Set<number>;
  /** Flip one heatmap category between active and off. */
  onToggle: (id: number) => void;
  /** Activate (true) or deactivate (false) a batch of ids — group toggles. */
  onSetMany: (ids: number[], active: boolean) => void;
}

/** Group accent, normalizing MapGenie's bare "RRGGBB" hex. */
function groupColor(group: HeatmapGroupResponse): string {
  const c = group.color;
  if (!c) return '#ef4444';
  return c.startsWith('#') ? c : `#${c}`;
}

/**
 * Heatmap visibility list — a sibling of {@link CategoryPanel} in the sidebar,
 * in the same collapsible-group style. Each group (e.g. "Pals") is a section
 * header with a master toggle; its categories render as a two-column grid of
 * name + point count. Unlike marker categories (visible by default, toggled
 * off), heatmaps start OFF and toggle on; every active category's points merge
 * into one density layer on the map.
 */
export const HeatmapPanel: React.FC<HeatmapPanelProps> = ({
  groups,
  active,
  onToggle,
  onSetMany,
}) => {
  // Collapsed group ids; groups start expanded.
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());

  const displayed = groups.filter((g) => g.categories.length > 0);
  if (displayed.length === 0) return null;

  const toggleCollapse = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-0.5">
      {displayed.map((group) => {
        const memberIds = group.categories.map((c) => c.id);
        const activeInGroup = memberIds.filter((id) => active.has(id)).length;
        const groupAllActive = activeInGroup === memberIds.length;
        const groupNoneActive = activeInGroup === 0;
        const isCollapsed = collapsed.has(group.id);
        const color = groupColor(group);

        return (
          <div key={group.id} className="flex flex-col">
            <div className="flex items-center gap-1 rounded-lg px-1 hover:bg-white/5">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left"
                aria-expanded={!isCollapsed}
                onClick={() => toggleCollapse(group.id)}
              >
                <Chevron collapsed={isCollapsed} />
                <FlameIcon size={18} className="flex-none text-fg" />
                <span
                  className={`section-title min-w-0 flex-1 truncate${
                    groupNoneActive ? ' opacity-45' : ''
                  }`}
                >
                  {group.name}
                </span>
              </button>
              <button
                type="button"
                className="flex-none p-1"
                aria-label={`Toggle ${group.name} heatmaps`}
                // All active -> switch the group off; otherwise -> all on.
                onClick={() => onSetMany(memberIds, !groupAllActive)}
              >
                <ColorCheck
                  color={color}
                  checked={groupAllActive}
                  indeterminate={!groupAllActive && !groupNoneActive}
                />
              </button>
            </div>
            {!isCollapsed && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pb-1 pl-6">
                {group.categories.map((cat) => {
                  const isActive = active.has(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onToggle(cat.id)}
                      className={`flex items-center gap-1.5 rounded-md px-1 py-1 text-left text-sm hover:bg-white/5${
                        isActive ? '' : ' opacity-40'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 flex-none rounded-full"
                        // Mini heat swatch: hot core fading out, like the layer.
                        style={{
                          background:
                            'radial-gradient(circle, #ffff00 0%, #ff0000 65%, rgba(255,0,0,0.25) 100%)',
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                      <span className="flex-none text-xs font-bold tabular-nums text-fg">
                        {cat.points.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
