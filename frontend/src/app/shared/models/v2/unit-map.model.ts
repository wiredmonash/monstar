import { IUnit } from './unit.schema';

export type UnitMapNodeType = 'prerequisite' | 'current' | 'parent';
export type UnitMapEdgeType = 'prerequisite' | 'parent';

/**
 * A node in the unit graph: the current unit, one of its prerequisites, or a
 * parent unit that lists the current unit as a prerequisite.
 */
export interface UnitMapNode {
  id: string;
  label: string;
  data: {
    type: UnitMapNodeType;
    name: string;
  };
}

/**
 * An edge in the unit graph, linking a prerequisite to the current unit or the
 * current unit to a parent.
 */
export interface UnitMapEdge {
  id: string;
  source: string;
  target: string;
  data: {
    type: UnitMapEdgeType;
  };
}

/**
 * Map-ready data assembled from a unit and the units that require it. Holds the
 * graph nodes and edges plus the display fields the map sidebar renders.
 */
export interface UnitMap {
  unit: IUnit;
  nodes: UnitMapNode[];
  edges: UnitMapEdge[];
  prerequisiteUnitCodes: string[];
  prerequisiteNumReq: number;
  parentUnitCodes: string[];
}
