import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '@services/api/user.service';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';
import { State } from '../user-profile.state';

@Component({
  selector: 'app-profile-panel',
  standalone: true,
  imports: [LogoutButtonComponent],
  templateUrl: './profile-panel.component.html',
  styleUrl: './profile-panel.component.scss',
})
export class ProfilePanelComponent {
  @Input({ required: true }) state!: State;
  @Output() usernameSaved = new EventEmitter<string>();
  @Output() logoutPressed = new EventEmitter<void>();

  @ViewChild('usernameSpan') usernameSpan?: ElementRef<HTMLElement>;
  @ViewChild('usernameInput') usernameInput?: ElementRef<HTMLInputElement>;

  private userService = inject(UserService);

  editing = signal(false);
  draft = signal('');
  error = signal<string | null>(null);
  saving = signal(false);
  // Pins the input to the display text's width so nothing shifts on edit.
  editWidth = signal(0);

  startEdit() {
    if (!this.state.isCurrentUser || this.saving()) return;
    this.editWidth.set(this.usernameSpan?.nativeElement.offsetWidth ?? 0);
    this.draft.set(this.state.username ?? '');
    this.error.set(null);
    this.editing.set(true);
    setTimeout(() => this.usernameInput?.nativeElement.select());
  }

  cancel() {
    this.draft.set(this.state.username ?? '');
    this.error.set(null);
    this.editing.set(false);
  }

  save() {
    // Guard re-entry: removing/disabling the input fires a stray blur→save
    // after a save has already started or finished.
    if (this.saving() || !this.editing()) return;

    const next = this.draft().trim();
    const userId = this.state.user?._id;

    if (!next || next === this.state.username || !userId) {
      this.cancel();
      return;
    }

    this.error.set(null);
    this.saving.set(true);
    this.userService.updateUsername(userId, next).subscribe({
      next: (newUsername) => {
        this.saving.set(false);
        this.editing.set(false);
        this.usernameSaved.emit(newUsername);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'Could not update username');
      },
    });
  }
}
