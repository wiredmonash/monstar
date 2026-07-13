import { DeleteAccountButtonComponent } from './delete-account-button.component';

describe('DeleteAccountButtonComponent', () => {
  let component: DeleteAccountButtonComponent;

  beforeEach(() => {
    component = new DeleteAccountButtonComponent();
  });

  it('arms the confirm on the first click without emitting', () => {
    const spy = jasmine.createSpy('confirmed');
    component.confirmed.subscribe(spy);

    component.onClick();

    expect(component.confirming()).toBeTrue();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits confirmed on the second click', () => {
    const spy = jasmine.createSpy('confirmed');
    component.confirmed.subscribe(spy);

    component.onClick(); // arm
    component.onClick(); // confirm

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('keeps the confirm armed briefly after mouse leave, then disarms', () => {
    jasmine.clock().install();
    component.onClick();

    component.scheduleReset();
    jasmine.clock().tick(1000);
    expect(component.confirming()).toBeTrue(); // still armed during grace period

    jasmine.clock().tick(3000);
    expect(component.confirming()).toBeFalse(); // disarmed after the delay
    jasmine.clock().uninstall();
  });

  it('cancels the pending reset when the mouse returns', () => {
    jasmine.clock().install();
    component.onClick();

    component.scheduleReset();
    component.cancelReset();
    jasmine.clock().tick(5000);

    expect(component.confirming()).toBeTrue();
    jasmine.clock().uninstall();
  });
});
