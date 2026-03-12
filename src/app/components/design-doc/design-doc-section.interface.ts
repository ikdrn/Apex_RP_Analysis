export interface DesignDocItem {
  label: string;
  content: string;
  diagram?: string;
}

export interface DesignDocSection {
  id: 'requirements' | 'basic-design' | 'detailed-design' | 'testing';
  title: string;
  items: DesignDocItem[];
  order: number;
}
