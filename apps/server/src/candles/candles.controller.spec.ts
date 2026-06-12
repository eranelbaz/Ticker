import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

describe('CandlesController', () => {
  let controller: CandlesController;

  beforeEach(() => {
    controller = new CandlesController(new CandlesService());
  });

  it('returns candles for a symbol', async () => {
    await expect(controller.getCandles('BTCUSD', 10)).resolves.toHaveLength(10);
  });

  it('clamps count to the maximum of 1000', async () => {
    await expect(controller.getCandles('BTCUSD', 5000)).resolves.toHaveLength(
      1000,
    );
  });

  it('clamps count to the minimum of 1', async () => {
    await expect(controller.getCandles('BTCUSD', -5)).resolves.toHaveLength(1);
  });
});
