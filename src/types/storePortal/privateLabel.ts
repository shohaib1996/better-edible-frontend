export interface SelectedCannabinoid {
  name: string;
  mg: number;
  adder: number;
}

export interface LorannComponent {
  name: string;
  ratio_pct: number;
}

export interface GummyResult {
  hex: string;
  color_name: string;
  rationale: string;
  flavor_description: string;
  lorann_components: LorannComponent[];
}

export interface LineItem {
  id: string;
  flavorName: string;
  flavorNotes: string;
  gummySize: string;
  oilType: string;
  effect: string;
  isSour: boolean;
  units: number;
  cannabinoids: SelectedCannabinoid[];
  unitPrice: number;
  color: GummyResult;
}
