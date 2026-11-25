import type { AssetClass } from '@/lib/market-data/types';
import type { ExecutionProvider, ProviderCapabilities, OrderIntent, ExecutionResult } from './types';

class DisabledLiveAdapter implements ExecutionProvider {
  readonly capabilities: ProviderCapabilities;
  constructor(readonly id: string, assetClass: AssetClass) {
    this.capabilities = {
      assetClasses: [assetClass],
      orderTypes: [],
      supportsFractional: false,
      supportsShortSelling: false,
      supportsPrePostMarket: false,
      supportsClientOrderId: true,
    };
  }
  async submit(_intent: OrderIntent): Promise<ExecutionResult> {
    return { accepted: false, code: 'LIVE_EXECUTION_LOCKED', reason: 'Live execution is disabled until a regulated provider, compliance controls and production risk certification are approved.' };
  }
  async cancel(_providerOrderId: string): Promise<ExecutionResult> {
    return { accepted: false, code: 'LIVE_EXECUTION_LOCKED', reason: 'No live provider order exists in this environment.' };
  }
}

// These are provider slots, not connected broker accounts. Never route a live order
// to a slot until its adapter, credentials, permissions and conformance tests exist.
const adapters: Record<AssetClass, ExecutionProvider> = {
  crypto: new DisabledLiveAdapter('crypto-provider-slot', 'crypto'),
  equity: new DisabledLiveAdapter('equity-broker-slot', 'equity'),
  forex: new DisabledLiveAdapter('fx-broker-slot', 'forex'),
  commodity: new DisabledLiveAdapter('commodity-broker-slot', 'commodity'),
};

export function getExecutionProvider(assetClass: AssetClass): ExecutionProvider {
  return adapters[assetClass];
}

export function getExecutionReadiness() {
  return Object.entries(adapters).map(([assetClass, adapter]) => ({
    assetClass,
    providerSlot: adapter.id,
    connected: false,
    liveEnabled: false,
    supportedOrderTypes: adapter.capabilities.orderTypes,
  }));
}
