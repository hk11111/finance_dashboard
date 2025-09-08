export interface Transaction {
  id: string;
  date: string; // ISO date string
  description: string;
  amount: number;
  category: string;
  accountId: string;
  source: string; // bank source
  parentId?: string; // for splits
}
