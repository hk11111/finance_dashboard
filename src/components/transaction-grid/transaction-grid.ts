import { DataService } from '../../services/data-service';
import { Grid, GridOptions } from 'ag-grid-community';
import { customElement } from 'aurelia';

@customElement('transaction-grid')
export class TransactionGrid {
  static dependencies = [DataService];
  gridOptions: GridOptions;
  grid!: HTMLElement;

  constructor(private dataService: DataService) {
    this.gridOptions = {
      columnDefs: [
        { field: 'date' },
        { field: 'description' },
        { field: 'amount' },
        { field: 'category', editable: true },
        { field: 'accountId' },
        {
          headerName: 'Split',
          cellRenderer: params => `<button class="split-btn">Split</button>`,
          onCellClicked: params => this.split(params.data.id)
        }
      ],
      rowData: this.dataService.transactions,
      onCellValueChanged: params => {
        this.dataService.updateTransaction(params.data.id, { category: params.data.category });
      }
    };
  }

  attached() {
    new Grid(this.grid, this.gridOptions);
  }

  split(id: string) {
    const amount = prompt('Enter amounts and categories separated by comma (e.g. 10:food,5:entertainment)');
    if (!amount) return;
    const splits = amount.split(',').map(p => {
      const [amt, cat] = p.split(':');
      return { amount: parseFloat(amt), category: cat || 'uncategorized' };
    });
    this.dataService.splitTransaction(id, splits);
    this.gridOptions.api?.setRowData(this.dataService.transactions);
  }
}
