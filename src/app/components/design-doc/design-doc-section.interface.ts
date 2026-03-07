export interface DesignDocTable {
  headers: string[];
  rows: string[][];
}

export interface DesignDocDiagramNode {
  label: string;
  sublabel?: string;
  description?: string;
  color: 'blue' | 'gray' | 'teal' | 'purple' | 'green' | 'orange' | 'red';
}

export interface DesignDocDiagram {
  type: 'flow-h' | 'comparison';
  // flow-h 用
  nodes?: DesignDocDiagramNode[];
  // comparison（As-Is vs To-Be）用
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
}

export interface DesignDocItem {
  label: string;
  content: string;
  subItems?: string[];
  table?: DesignDocTable;
  diagram?: DesignDocDiagram;
  /** monospace コードブロック（シーケンス図・ERモデル・ワイヤーフレーム等） */
  code?: string;
  /** 強調注記（黄色ボックス） */
  note?: string;
}

export interface DesignDocSection {
  id: 'requirements' | 'basic-design' | 'detailed-design' | 'testing' | 'future';
  title: string;
  items: DesignDocItem[];
  order: number;
}
