export interface DesignDocTable {
  headers: string[];
  rows: string[][];
}

export interface DesignDocItem {
  label: string;
  content: string;
  subItems?: string[];
  table?: DesignDocTable;
}

export interface DesignDocSection {
  id: 'requirements' | 'basic-design' | 'detailed-design' | 'testing' | 'future';
  title: string;
  items: DesignDocItem[];
  order: number;
}
