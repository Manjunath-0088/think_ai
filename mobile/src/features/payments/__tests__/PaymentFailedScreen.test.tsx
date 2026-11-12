import { PaymentFailedScreen } from '../screens/PaymentFailedScreen';
import { failureMessages } from '../failure';

describe('PaymentFailedScreen', () => {
  it('is defined', () => {
    expect(PaymentFailedScreen).toBeDefined();
  });
  it('has messages for failure types', () => {
    expect(failureMessages.declined.title).toBeDefined();
    expect(failureMessages.insufficient_funds.title).toBeDefined();
    expect(failureMessages.expired.title).toBeDefined();
    expect(failureMessages.network.title).toBeDefined();
  });
});
