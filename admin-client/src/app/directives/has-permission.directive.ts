import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { UserService } from '../services/user.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input('appHasPermission') requiredActions: string | string[] = [];
  @Input() appPermissionResource: string = '*';
  @Input() appPermissionRequireAll = false; // if true, all actions must be allowed; otherwise any one action

  private sub?: Subscription;

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private permission: PermissionService,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.sub = this.userService.userDetails$.subscribe(() => {
      this.updateView();
    });
    this.updateView();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateView(): void {
    const actions = Array.isArray(this.requiredActions) ? this.requiredActions : [this.requiredActions];
    const normalized = actions.filter(Boolean).map((a) => a.toLowerCase());

    const isAllowed = normalized.length === 0
      ? true
      : this.appPermissionRequireAll
        ? normalized.every((a) => this.permission.can(a, this.appPermissionResource))
        : normalized.some((a) => this.permission.can(a, this.appPermissionResource));

    this.vcr.clear();
    if (isAllowed) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
