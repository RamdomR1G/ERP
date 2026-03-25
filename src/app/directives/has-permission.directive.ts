import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  @Input() set appHasPermission(permission: string | null) {
    if (!permission) {
        this.addTemplate();
        return;
    }

    const hasPerm = this.authService.hasPermission(permission);

    if (hasPerm && !this.hasView) {
      this.addTemplate();
    } else if (!hasPerm && this.hasView) {
      this.clearTemplate();
    }
  }

  private addTemplate() {
    this.viewContainer.createEmbeddedView(this.templateRef);
    this.hasView = true;
  }

  private clearTemplate() {
    this.viewContainer.clear();
    this.hasView = false;
  }
}