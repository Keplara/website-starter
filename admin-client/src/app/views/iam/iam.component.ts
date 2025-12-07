import { Component, Injectable } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CollectionViewer, SelectionChange, DataSource } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatChipsModule } from '@angular/material/chips';

export interface IAMUser {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  avatar: string;
  roles: string[];
}

// client will call management api which will have a route /getPolicy
// clients can determine with the policyService what actions are allowed per user
// For this client, the json object represented in the service can be used to display in IAM view as well
// as enforce permissions in the UI and make changes.


// Flat node with expandable and level information
export class DynamicFlatNode {
  constructor(
    public item: string,
    public level = 1,
    public expandable = false,
    public isLoading = false,
  ) {}
}

@Injectable({ providedIn: 'root' })
export class DynamicDatabase {
  dataMap = new Map<string, string[]>([
    ['User', ['Read', 'Edit', 'Create', 'Delete']],
    ['Product', ['Edit', 'Read', 'Create', 'Delete']],
    ['Edit', ['Name', 'Birthday']],
  ]);

  rootLevelNodes: string[] = ['User', 'Product'];

  initialData(): DynamicFlatNode[] {
    return this.rootLevelNodes.map(name => new DynamicFlatNode(name, 0, true));
  }

  getChildren(node: string): string[] | undefined {
    return this.dataMap.get(node);
  }

  isExpandable(node: string): boolean {
    return this.dataMap.has(node);
  }
}

export class DynamicDataSource implements DataSource<DynamicFlatNode> {
  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  get data(): DynamicFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: DynamicFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<DynamicFlatNode>,
    private _database: DynamicDatabase,
  ) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this._treeControl.expansionModel.changed.subscribe(change => {
      if ((change as SelectionChange<DynamicFlatNode>).added || (change as SelectionChange<DynamicFlatNode>).removed) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed.slice().reverse().forEach(node => this.toggleNode(node, false));
    }
  }

  toggleNode(node: DynamicFlatNode, expand: boolean) {
    const children = this._database.getChildren(node.item);
    const index = this.data.indexOf(node);
    if (!children || index < 0) return;
    if (expand) {
      const nodes = children.map(name => new DynamicFlatNode(name, node.level + 1, this._database.isExpandable(name)));
      this.data.splice(index + 1, 0, ...nodes);
    } else {
      let count = 0;
      for (let i = index + 1; i < this.data.length && this.data[i].level > node.level; i++, count++) {}
      this.data.splice(index + 1, count);
    }
    this.dataChange.next(this.data);
    node.isLoading = false;
  }
}
// Remove the tree inplace of a list of the user's actions
@Injectable({ providedIn: 'root' })
export class PolicyService {
  private fakePolicy = {
    Action: [
      'user:EditName',
      'user:EditBirthdate',
      'user:EditAge',
      'user:EditEmail',
      'user:EditPassword',
      'product:EditAll',
      'product:EditPrice',
      'product:EditStock',
      'product:EditDescription',
    ]
  };

  getPolicy(): Observable<{ Action: string[] }> {
    return of(this.fakePolicy);
  }
}

@Component({
  selector: 'app-iam',
  templateUrl: './iam.component.html',
  styleUrls: ['./iam.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTreeModule,
    MatProgressBarModule
  ]
})
export class IAMComponent {
  treeControl: FlatTreeControl<DynamicFlatNode>;
  dataSource: DynamicDataSource;
  selectedUser: any = null;
  search: string = '';
    users: IAMUser[] = [
    {
      id: 1,
      firstname: 'Alice',
      lastname: 'Smith',
      username: 'asmith',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      roles: ['Admin', 'Editor']
    },
    {
      id: 2,
      firstname: 'Bob',
      lastname: 'Johnson',
      username: 'bjohnson',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      roles: ['Viewer']
    },
    {
      id: 3,
      firstname: 'Carol',
      lastname: 'Williams',
      username: 'cwilliams',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      roles: ['Editor']
    },
    {
      id: 4,
      firstname: 'David',
      lastname: 'Brown',
      username: 'dbrown',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      roles: ['Admin']
    }
  ];
  
  constructor(database: DynamicDatabase) {
    this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new DynamicDataSource(this.treeControl, database);
    this.dataSource.data = database.initialData();
  }

  getLevel = (node: DynamicFlatNode) => node.level;
  isExpandable = (node: DynamicFlatNode) => node.expandable;
  hasChild = (_: number, node: DynamicFlatNode) => node.expandable;
  // ...existing user list logic (if needed) ...
  selectUser(user: IAMUser) {
    this.selectedUser = user;
  }

  filteredUsers(): IAMUser[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.users;
    return this.users.filter(u =>
      u.firstname.toLowerCase().includes(term) ||
      u.lastname.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term)
    );
  }
}