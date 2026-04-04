/** Display labels for oracle tier ids (1–3). LTV caps are governance parameters. */
export const PROTOCOL_TIER_ROWS = [
  { tierId: 1, name: "Blue Chip", ltvPercent: 40 },
  { tierId: 2, name: "Growth", ltvPercent: 25 },
  { tierId: 3, name: "Exotic", ltvPercent: 15 },
] as const;
