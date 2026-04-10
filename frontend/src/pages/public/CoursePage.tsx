import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

// ============================================================================
// Types
// ============================================================================

interface Preset {
  id: string;
  icon: string;
  label: string;
}

interface StateCard {
  id: string;
  iconClass: string; // z1 | z2 | sA | sB | sC
  icon: string;
  title: string;
  sub: string;
}

interface RouteStep {
  n: string;
  title: string;
  desc: string;
}

interface RouteEstimateRow {
  label: string;
  value: string;
  sub?: string;
  isTotal?: boolean;
}

interface RouteData {
  pills: string[];
  kicker?: string;
  title: string;
  desc: string;
  meta: string[];
  steps: RouteStep[];
  totalEst: string;
  estimate: RouteEstimateRow[];
  note?: string;
}

interface AccItem {
  id: string;
  num: string;
  numClass?: string; // '' | 'is-core' | 'is-mnt'
  chip: string;
  chipClass: string; // 'pre' | 'core' | 'mnt' | 'str' | 'ads'
  name: string;
  tags: string[];
  price: string;
  desc: string;
  whoTitle: string;
  who: string[];
  learnTitle: string;
  learn: string[];
  metaChips: string[];
}

interface AccCategory {
  icon: string;
  title: string;
  sub: string;
  core?: boolean;
  items: AccItem[];
}

interface SvcItem {
  id: string;
  code: string;
  codeClass: string; // 'pre' | 'core' | 'mnt' | 'str' | 'ads'
  name: string;
  desc: string;
  price: number;
  priceLabel: string;
}

interface SvcGroup {
  icon: string;
  title: string;
  items: SvcItem[];
}

interface PkgCard {
  id: string;
  featured?: boolean;
  tier: string;
  name: string;
  price: string;
  duration: string;
  includes: string[];
  tags?: string[];
}

interface AddOn {
  code: string;
  codeClass: string;
  name: string;
  desc: string;
  price: string;
}

// ============================================================================
// Data (populated in later phases)
// ============================================================================

const PRESETS: Preset[] = [];
const STATES: StateCard[] = [];
const ROUTES: Record<string, RouteData> = {};
const MODULES: AccCategory[] = [];
const SERVICE_GROUPS: SvcGroup[] = [];
const PACKAGES: PkgCard[] = [];
const ADDONS: AddOn[] = [];

// ============================================================================
// Scoped CSS (populated in Phase 9-10)
// ============================================================================

const COURSE_CSS = `
.aiv5-page { font-family: var(--font-ko); }
`;

// ============================================================================
// Component
// ============================================================================

export function CoursePage() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [openAccId, setOpenAccId] = useState<string | null>(null);
  const [selectedSvcs, setSelectedSvcs] = useState<Map<string, SvcItem>>(new Map());
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMemo, setFormMemo] = useState('');

  useEffect(() => {
    const styleId = 'aiv5-course-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = COURSE_CSS;
    document.head.appendChild(style);
  }, []);

  // Suppress unused warnings until later phases wire them up
  void PRESETS; void STATES; void ROUTES; void MODULES;
  void SERVICE_GROUPS; void PACKAGES; void ADDONS;
  void selectedState; void setSelectedState;
  void openAccId; void setOpenAccId;
  void selectedSvcs; void setSelectedSvcs;
  void modalOpen; void setModalOpen;
  void formName; void setFormName;
  void formPhone; void setFormPhone;
  void formEmail; void setFormEmail;
  void formMemo; void setFormMemo;
  void ReactDOM;

  return (
    <div className="aiv5-page">
      {/* Phase 1 skeleton — sections rendered in later phases */}
    </div>
  );
}
