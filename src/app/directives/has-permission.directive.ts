import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  private permission = signal<string | null>(null);
  private hasView = false;

  constructor() {
    // Reaccionamos automáticamente a cambios en el grupo activo o identidad del usuario
    effect(() => {
      const p = this.permission();
      const group = this.authService.activeGroupSignal(); // Trigger reactivo
      
      if (!p) {
        this.updateView(true);
        return;
      }

      const hasPerm = this.authService.hasPermission(p);
      this.updateView(hasPerm);
    });
  }

  @Input() set appHasPermission(val: string | null) {
    this.permission.set(val);
  }

  private updateView(show: boolean) {
    if (show && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!show && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}