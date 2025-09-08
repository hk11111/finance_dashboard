import { Transaction } from '../models/transaction';
import { Account } from '../models/account';
import * as XLSX from 'xlsx';

export class DataService {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  private splitHistory: Record<string, { amount: number; category: string }[]> = {};

  constructor() {
    this.load();
  }

  private persist() {
    const data = JSON.stringify({ transactions: this.transactions, accounts: this.accounts, splitHistory: this.splitHistory });
    localStorage.setItem('hfd-data', data);
  }

  private load() {
    const raw = localStorage.getItem('hfd-data');
    if (raw) {
      const parsed = JSON.parse(raw);
      this.transactions = parsed.transactions || [];
      this.accounts = parsed.accounts || [];
      this.splitHistory = parsed.splitHistory || {};
    }
  }

  importFromFile(file: File, source: string) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
        const txs = this.mapRows(rows, source);
        this.addTransactions(txs);
        txs.forEach(t => {
          const history = this.splitHistory[t.id];
          if (history) {
            this.splitTransaction(t.id, history);
          }
        });
        resolve();
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private mapRows(rows: any[], source: string): Transaction[] {
    // TODO: implement specific mapping per bank/credit card
    // For now assume generic format: [date, description, amount]
    const [, ...dataRows] = rows; // skip header
    return dataRows.filter(r => r.length >= 3).map(r => ({
      id: `${source}-${r[0]}-${r[1]}-${r[2]}`,
      date: new Date(r[0]).toISOString(),
      description: r[1],
      amount: parseFloat(r[2]),
      category: 'uncategorized',
      accountId: source,
      source
    }));
  }

  private addTransactions(txs: Transaction[]) {
    txs.forEach(tx => {
      if (!this.transactions.find(t => t.id === tx.id)) {
        this.transactions.push(tx);
      }
    });
    this.persist();
  }

  splitTransaction(id: string, splits: { amount: number; category: string }[]) {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) return;
    this.transactions = this.transactions.filter(t => t.id !== id);
    splits.forEach((s, idx) => {
      this.transactions.push({
        ...tx,
        id: `${id}-split-${idx}`,
        amount: s.amount,
        category: s.category,
        parentId: id
      });
    });
    this.persist();

    this.splitHistory[id] = splits;
    this.persist();
  }

  updateTransaction(id: string, props: Partial<Transaction>) {
    const tx = this.transactions.find(t => t.id === id);
    if (tx) {
      Object.assign(tx, props);
      this.persist();
    }
  }

  moveBetweenAccounts(from: string, to: string, amount: number, description: string) {
    const date = new Date().toISOString();
    const id = `transfer-${date}`;
    this.transactions.push({
      id: `${id}-from`,
      date,
      description,
      amount: -Math.abs(amount),
      category: 'transfer',
      accountId: from,
      source: 'internal'
    });
    this.transactions.push({
      id: `${id}-to`,
      date,
      description,
      amount: Math.abs(amount),
      category: 'transfer',
      accountId: to,
      source: 'internal',
      parentId: `${id}-from`
    });
    this.persist();
  }

  exportToJson() {
    const blob = new Blob([
      JSON.stringify({ accounts: this.accounts, transactions: this.transactions, splitHistory: this.splitHistory }, null, 2)
    ], { type: 'application/json' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hfd-data-${ts}.json`;
    a.click();
  }

  async importFromJson(file: File) {
    const text = await file.text();
    const data = JSON.parse(text);
    this.accounts = data.accounts || [];
    this.transactions = data.transactions || [];
    this.splitHistory = data.splitHistory || {};
    this.persist();
  }
}
