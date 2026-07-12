import { Directive, Input, OnChanges, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthorizationService } from '../../services/authorization.service';

export interface CanDoConfig {
  menuKey: string;
  submenuKey: string;
  actionKey: string;
}

@Directive({
  selector: '[appCan],[appCanDo]',
  standalone: true
})
export class CanDirective implements OnChanges {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authorizationService = inject(AuthorizationService);

  @Input() appCan: string | null = null;
  @Input() appCanDo: CanDoConfig | null = null;

  ngOnChanges(): void {
    const canRender = this.resolveAccess();
    this.viewContainer.clear();

    if (canRender) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  private resolveAccess(): boolean {
    if (this.appCanDo) {
      return this.authorizationService.canDo(this.appCanDo.menuKey, this.appCanDo.submenuKey, this.appCanDo.actionKey);
    }

    if (this.appCan) {
      return this.authorizationService.hasPermission(this.appCan);
    }

    return true;
  }
}
