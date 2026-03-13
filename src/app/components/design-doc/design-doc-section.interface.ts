export interface DesignDocItem {
  label: string;
  content?: string;
  contentHtml?: string;
  diagram?: string;
}

export type DesignDocSectionId =
  | 'requirements'
  | 'basic-design'
  | 'detailed-design'
  | 'unit-test'
  | 'integration-test'
  | 'system-test'
  | 'config-management';

export interface DesignDocSection {
  id: DesignDocSectionId;
  title: string;
  items: DesignDocItem[];
  order: number;
}
