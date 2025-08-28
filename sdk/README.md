# DAI Agents SDK

A TypeScript SDK for building and managing decentralized Multi AI agents communications using smart contracts.

## Features

- **Agent Management**: Register and manage AI agents on the blockchain
- **Message Communication**: Send and receive messages between agents
- **Event Monitoring**: Real-time event monitoring with polling architecture
- **Contract Deployment**: Deploy your own AgentController contracts
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install dai-agents-sdk
# or
yarn add dai-agents-sdk
# or
pnpm add dai-agents-sdk
```

## Quick Start

### 1. Deploy a New Contract

```typescript
import { AgentSDK, DeploymentConfig } from 'dai-agents-sdk';

const deployConfig: DeploymentConfig = {
  rpcUrl: 'http://localhost:8545',
  privateKey: 'your-private-key',
  chainId: 1337,
};

const sdk = await AgentSDK.deployController(deployConfig);
console.log('Contract deployed at:', await sdk.getContractAddress());
```

### 2. Connect to Existing Contract

```typescript
import { AgentSDK, SDKConfig } from 'dai-agents-sdk';

const config: SDKConfig = {
  rpcUrl: 'http://localhost:8545',
  privateKey: 'your-private-key',
  contractAddress: '0x...', // existing contract address
};

const sdk = new AgentSDK(config);
```

### 3. Register a New Agent

```typescript
import { AgentRole } from 'dai-agents-sdk';

const result = await sdk.createNewAgent({
  name: 'ChatBot Assistant',
  role: AgentRole.Chat,
  ipfsHash: 'QmYourIPFSHash', // Optional metadata
});

console.log('Agent ID:', result.agentId);
```

### 4. Send Messages Between Agents

```typescript
// Send a message
const messageResult = await sdk.sendMessage({
  agentId: receiverAgentId,
  message: 'Hello! How can I help you?',
});

// Respond to a message
await sdk.respondToMessage({
  messageId: messageResult.messageId,
  receiverAgentId: senderAgentId,
  response: 'Thank you for your message!',
});
```

### 5. Monitor Events

```typescript
// Set up event listeners
sdk.onAgentRegistered((event) => {
  console.log('New agent registered:', event);
});

sdk.onMessageSent((event) => {
  console.log('Message sent:', event);
});

sdk.onMessageResponded((event) => {
  console.log('Message responded:', event);
});

// Start monitoring
await sdk.startEventMonitoring({
  fromBlock: 'latest',
  pollInterval: 5000, // Poll every 5 seconds
});
```

## API Reference

### AgentSDK

The main SDK class for interacting with the DAI Agents Toolkit.

#### Constructor

```typescript
new AgentSDK(config: SDKConfig)
```

#### Static Methods

- `deployController(config: DeploymentConfig): Promise<AgentSDK>` - Deploy a new contract

#### Instance Methods

- `createNewAgent(params: RegisterAgentParams): Promise<{agentId: bigint, transactionHash: string, agent: Agent}>` - Register a new agent
- `sendMessage(params: SendMessageParams): Promise<{messageId: bigint, transactionHash: string}>` - Send a message
- `respondToMessage(params: RespondToMessageParams): Promise<{transactionHash: string}>` - Respond to a message
- `getAllAgents(): Promise<Agent[]>` - Get all registered agents
- `getAgentCount(): Promise<bigint>` - Get total agent count
- `getAgentById(agentId: bigint): Promise<Agent | null>` - Get agent by ID
- `startEventMonitoring(options?: EventListenerOptions): Promise<void>` - Start event monitoring
- `stopEventMonitoring(): void` - Stop event monitoring
- `getHistoricalEvents(options?: EventFilterOptions): Promise<Events>` - Get historical events

#### Event Listeners

- `onAgentRegistered(callback: AgentRegisteredCallback): void`
- `onMessageSent(callback: MessageSentCallback): void`
- `onMessageResponded(callback: MessageRespondedCallback): void`
- `onAgentUpdated(callback: AgentUpdatedCallback): void`
- `onError(callback: (error: Error) => void): void`

### Types

#### AgentRole

```typescript
enum AgentRole {
  Agent = 0,  // Standard agent with tool capabilities
  Chat = 1    // Chat-only agent
}
```

#### Agent

```typescript
interface Agent {
  id: bigint;
  name: string;
  role: AgentRole;
  ipfsHash: string;
}
```

#### SDKConfig

```typescript
interface SDKConfig {
  rpcUrl: string;
  privateKey?: string;
  contractAddress?: string;
  chainId?: number;
}
```

#### DeploymentConfig

```typescript
interface DeploymentConfig {
  rpcUrl: string;
  privateKey: string;
  chainId?: number;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
}
```

## Event Monitoring Architecture

The SDK uses a polling-based event monitoring system that:

1. Polls the blockchain at regular intervals (configurable)
2. Fetches new events since the last processed block
3. Parses and emits events through EventEmitter
4. Provides both real-time and historical event access

### Event Types

- **AgentRegistered**: When a new agent is registered
- **MessageSent**: When a message is sent between agents
- **MessageResponded**: When an agent responds to a message
- **AgentUpdated**: When agent information is updated

## Examples

Check the `examples/` directory for complete usage examples:

- `basic-usage.ts` - Complete workflow example
- More examples coming soon...

## Development

```bash
# Install dependencies
pnpm install

# Build the SDK
pnpm build

# Run development mode
pnpm dev
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
