import {
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';

/** How long the armed "Are you sure?" state lingers after the mouse leaves. */
const RESET_DELAY_MS = 3000;

@Component({
  selector: 'app-delete-account-button',
  standalone: true,
  templateUrl: './delete-account-button.component.html',
  styleUrl: './delete-account-button.component.scss',
})
export class DeleteAccountButtonComponent implements OnDestroy {
  @Output() confirmed = new EventEmitter<void>();

  /** First click arms the confirm; second click emits and deletes. */
  confirming = signal(false);

  private resetTimer?: ReturnType<typeof setTimeout>;

  onClick() {
    clearTimeout(this.resetTimer);
    if (this.confirming()) {
      this.confirmed.emit();
    } else {
      this.confirming.set(true);
    }
  }

  /** Mouse left: disarm, but only after a grace period. */
  scheduleReset() {
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(
      () => this.confirming.set(false),
      RESET_DELAY_MS
    );
  }

  /** Mouse came back in time: keep it armed. */
  cancelReset() {
    clearTimeout(this.resetTimer);
  }

  ngOnDestroy() {
    clearTimeout(this.resetTimer);
  }
}
