export interface SavedProject {
  id: string;
  name: string;
  type: 'Expert' | 'Deep RL Policy' | 'BPNN Scalper' | 'Multi-TF Matrix' | 'Grid Intelligence' | 'Risk Manager';
  language: 'MQL5' | 'MQL4' | 'PyTorch / ONNX' | 'LightGBM';
  symbol: string;
  timeframe: string;
  nodesCount: number;
  createdAt: string;
  modifiedAt: string;
  description?: string;
  nodes: any[];
  edges: any[];
  architectureSpec?: any;
}
