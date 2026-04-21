// ─────────────────────────────────────────────────────────────────────────────
// Chip Registry — single source of truth for all action chips in the platform.
// The AI selects chip IDs; the client maps them to actions.
// To add a new chip: add a definition here. No prompt engineering needed.
// ─────────────────────────────────────────────────────────────────────────────

export type ChipActionType =
  | "send_message"          // sends payload as a chat message
  | "navigate"              // router.push(payload)
  | "open_drive_add"        // Google Drive picker → add/set roster
  | "open_drive_edit"       // Google Drive picker → replace roster (with confirm)
  | "open_file_add"         // file input → add/set roster
  | "open_file_edit"        // file input → replace roster (with confirm)
  | "open_roster_pane_add"  // slide-in table panel, empty/new
  | "open_roster_pane_edit" // slide-in table panel, pre-filled with current roster
  | "confirm";              // generic confirm action (sends payload as message)

export interface ChipDef {
  id: string;
  label: string;
  action: ChipActionType;
  domain: "team" | "hotel" | "payments" | "logistics" | "global";
  payload?: string;
  description: string; // shown to AI in system prompt
}

export const CHIP_REGISTRY: Record<string, ChipDef> = {
  // ── Team Management — Add Roster ──────────────────────────────────────────
  roster_add_drive: {
    id: "roster_add_drive",
    label: "Import from Google Drive",
    action: "open_drive_add",
    domain: "team",
    description: "Import a new roster from Google Drive (CSV, Sheet, or PDF)",
  },
  roster_add_file: {
    id: "roster_add_file",
    label: "Upload CSV or PDF",
    action: "open_file_add",
    domain: "team",
    description: "Upload a CSV or PDF file to add roster players",
  },
  roster_enter_manual: {
    id: "roster_enter_manual",
    label: "Enter manually",
    action: "open_roster_pane_add",
    domain: "team",
    description: "Open a table panel to manually enter player details one by one",
  },

  // ── Team Management — Schedule ────────────────────────────────────────────
  schedule_add_drive: {
    id: "schedule_add_drive",
    label: "Import from Google Drive",
    action: "open_drive_add",
    domain: "team",
    description: "Import a game/tournament schedule from Google Drive (CSV or Sheet)",
  },
  schedule_add_file: {
    id: "schedule_add_file",
    label: "Upload schedule file",
    action: "open_file_add",
    domain: "team",
    description: "Upload a CSV file containing the game or tournament schedule",
  },
  schedule_skip: {
    id: "schedule_skip",
    label: "Skip for now",
    action: "send_message",
    domain: "team",
    payload: "I'll add the schedule later.",
    description: "Skip adding a schedule and move on",
  },

  // ── Team Management — Edit Roster ─────────────────────────────────────────
  roster_edit_drive: {
    id: "roster_edit_drive",
    label: "Replace via Google Drive",
    action: "open_drive_edit",
    domain: "team",
    description: "Replace the existing roster by importing a new file from Google Drive",
  },
  roster_edit_file: {
    id: "roster_edit_file",
    label: "Replace via CSV or PDF",
    action: "open_file_edit",
    domain: "team",
    description: "Replace the existing roster by uploading a new CSV or PDF file",
  },
  roster_edit_manual: {
    id: "roster_edit_manual",
    label: "Edit manually",
    action: "open_roster_pane_edit",
    domain: "team",
    description: "Open the current roster in a table panel to edit player details",
  },
};

// Domain → chip ID lists (used for system prompt injection and fallback chips)
export const DOMAIN_CHIPS: Record<string, string[]> = {
  team: Object.keys(CHIP_REGISTRY).filter(
    (id) => CHIP_REGISTRY[id].domain === "team"
  ),
};

// Build a human-readable chip menu for the system prompt
export function buildChipMenu(domain: string): string {
  const ids = DOMAIN_CHIPS[domain] ?? [];
  return ids
    .map((id) => `  ${id}: ${CHIP_REGISTRY[id].description}`)
    .join("\n");
}
