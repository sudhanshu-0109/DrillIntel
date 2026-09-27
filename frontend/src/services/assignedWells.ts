import { Well } from '../types';

export interface AssignedWellSummary {
  well_id: string;
  well_name: string;
  field: string;
  rig_name: string;
  current_depth: number;
  total_depth_md: number;
  current_formation: string;
  status: 'Drilling' | 'Circulating' | 'Logging' | 'Standby';
  is_live: boolean;
  alert_count: number;
  risk_level: 'HIGH' | 'MODERATE' | 'LOW';
  risk_probability: number;
  risk_type: string;
  last_activity: string;
}

/**
 * Returns active wells assigned to the logged-in engineer.
 * For the demo engineer (Piter Saikia / driller_piter), surfaces their assigned
 * operational drilling wells in the Upper Assam Asset.
 * Reference public analog wells (Volve, Utah FORGE) are kept in the RAG/analog
 * catalog and excluded from operational well rosters.
 */
export function getAssignedWellsForUser(
  username: string,
  rawWells: Well[] = []
): AssignedWellSummary[] {
  // If user is a drilling engineer or supervisor in Upper Assam
  return [
    {
      well_id: 'NWIS-ASSAM-003',
      well_name: 'OIL Duliajan Well #3',
      field: 'Duliajan Asset',
      rig_name: 'Rig OIL-14',
      current_depth: 3275.0,
      total_depth_md: 3850.0,
      current_formation: 'Tipam Sandstone',
      status: 'Drilling',
      is_live: true,
      alert_count: 2,
      risk_level: 'HIGH',
      risk_probability: 87,
      risk_type: 'Stuck Pipe Precursor',
      last_activity: 'Drilling ahead at 14.3 m/hr with torque escalation'
    },
    {
      well_id: 'NWIS-ASSAM-005',
      well_name: 'OIL Duliajan Well #5',
      field: 'Duliajan Asset',
      rig_name: 'Rig OIL-09',
      current_depth: 2810.0,
      total_depth_md: 4250.0,
      current_formation: 'Barail Sandstone',
      status: 'Drilling',
      is_live: true,
      alert_count: 0,
      risk_level: 'LOW',
      risk_probability: 12,
      risk_type: 'Nominal Operations',
      last_activity: 'Steady drilling with normal mud balance'
    },
    {
      well_id: 'NWIS-ASSAM-002',
      well_name: 'OIL Moran Well #2 (Re-Entry)',
      field: 'Moran Asset',
      rig_name: 'Rig OIL-04',
      current_depth: 1940.0,
      total_depth_md: 4100.0,
      current_formation: 'Namsang Formation',
      status: 'Drilling',
      is_live: true,
      alert_count: 1,
      risk_level: 'MODERATE',
      risk_probability: 42,
      risk_type: 'Loss Zone Precursor',
      last_activity: 'Circulating bottoms up prior to bit change'
    }
  ];
}
