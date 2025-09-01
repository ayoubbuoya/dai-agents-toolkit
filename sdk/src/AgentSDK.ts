import { JsonRpcProvider, Wallet } from 'ethers';
import { AgentController } from './AgentController.js';
import { EventMonitor } from './EventMonitor.js';
import {
  SDKConfig,
  DeploymentConfig,
  Agent,
  AgentRole,
  RegisterAgentParams,
  SendMessageParams,
  RespondToMessageParams,
  RateAgentParams,
  AgentReputation,
  EventFilterOptions,
  EventListenerOptions,
  AgentRegisteredCallback,
  MessageSentCallback,
  MessageRespondedCallback,
  AgentUpdatedCallback,
  AgentRatedCallback,
  TrustScoreUpdatedCallback
} from './types.js';

/**
 * Main SDK class for interacting with the DAI Agents Toolkit
 */
export class AgentSDK {
  public agentController: AgentController;
  public eventMonitor: EventMonitor;
  public provider: JsonRpcProvider;
  public wallet?: Wallet;

  constructor(config: SDKConfig) {
    this.provider = new JsonRpcProvider(config.rpcUrl);
    
    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey, this.provider);
    }

    if (!config.contractAddress) {
      throw new Error('Contract address is required. Use deployController() to deploy a new contract first.');
    }

    this.agentController = new AgentController(
      config.contractAddress,
      this.provider,
      this.wallet
    );

    this.eventMonitor = new EventMonitor(this.agentController);
  }

  /**
   * Deploy a new AgentController contract
   */
  static async deployController(config: DeploymentConfig): Promise<AgentSDK> {
    const agentController = await AgentController.deploy(config);
    const contractAddress = await agentController.getAddress();
    
    const sdkConfig: SDKConfig = {
      rpcUrl: config.rpcUrl,
      privateKey: config.privateKey,
      contractAddress,
      chainId: config.chainId
    };

    return new AgentSDK(sdkConfig);
  }

  /**
   * Create a new agent and register it on the contract
   */
  async createNewAgent(params: RegisterAgentParams): Promise<{
    agentId: bigint;
    transactionHash: string;
    agent: Agent;
  }> {
    if (!this.wallet) {
      throw new Error('Private key is required to create agents');
    }

    const tx = await this.agentController.registerAgent(params);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed');
    }

    // Parse the AgentRegistered event to get the agent ID
    const agentRegisteredEvent = receipt.logs.find(log => {
      try {
        const parsed = this.agentController.contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        return parsed?.name === 'AgentRegistered';
      } catch {
        return false;
      }
    });

    if (!agentRegisteredEvent) {
      throw new Error('AgentRegistered event not found in transaction receipt');
    }

    const parsedEvent = this.agentController.contract.interface.parseLog({
      topics: agentRegisteredEvent.topics,
      data: agentRegisteredEvent.data
    });

    const agentId = parsedEvent!.args.agentId;

    const agent: Agent = {
      id: agentId,
      name: params.name,
      role: params.role,
      ipfsHash: params.ipfsHash,
      trustScore: BigInt(100), // New agents start with 100% trust score
      totalInteractions: BigInt(0),
      positiveRatings: BigInt(0)
    };

    return {
      agentId,
      transactionHash: receipt.hash,
      agent
    };
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(params: SendMessageParams): Promise<{
    messageId: bigint;
    transactionHash: string;
  }> {
    if (!this.wallet) {
      throw new Error('Private key is required to send messages');
    }

    const tx = await this.agentController.sendMessageToAgent(params);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed');
    }

    // Parse the MessageSent event to get the message ID
    const messageSentEvent = receipt.logs.find(log => {
      try {
        const parsed = this.agentController.contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        return parsed?.name === 'MessageSent';
      } catch {
        return false;
      }
    });

    if (!messageSentEvent) {
      throw new Error('MessageSent event not found in transaction receipt');
    }

    const parsedEvent = this.agentController.contract.interface.parseLog({
      topics: messageSentEvent.topics,
      data: messageSentEvent.data
    });

    const messageId = parsedEvent!.args.messageId;

    return {
      messageId,
      transactionHash: receipt.hash
    };
  }

  /**
   * Respond to a message
   */
  async respondToMessage(params: RespondToMessageParams): Promise<{
    transactionHash: string;
  }> {
    if (!this.wallet) {
      throw new Error('Private key is required to respond to messages');
    }

    const tx = await this.agentController.respondToAgent(params);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return {
      transactionHash: receipt.hash
    };
  }

  /**
   * Get all registered agents
   */
  async getAllAgents(): Promise<Agent[]> {
    return await this.agentController.listAgents();
  }

  /**
   * Rate an agent's performance
   */
  async rateAgent(params: RateAgentParams): Promise<{
    transactionHash: string;
  }> {
    if (!this.wallet) {
      throw new Error('Private key is required to rate agents');
    }

    const tx = await this.agentController.rateAgent(params);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return {
      transactionHash: receipt.hash
    };
  }

  /**
   * Get an agent's reputation details
   */
  async getAgentReputation(agentId: bigint): Promise<AgentReputation> {
    return await this.agentController.getAgentReputation(agentId);
  }

  /**
   * Check if a rater has already rated a specific agent
   */
  async hasAgentRated(agentId: bigint, raterAgentId: bigint): Promise<boolean> {
    return await this.agentController.hasAgentRated(agentId, raterAgentId);
  }

  /**
   * Get the rating given by a specific rater to an agent
   */
  async getRating(agentId: bigint, raterAgentId: bigint): Promise<boolean> {
    return await this.agentController.getRating(agentId, raterAgentId);
  }

  /**
   * Get agents sorted by trust score (highest first)
   */
  async getTopRatedAgents(): Promise<Agent[]> {
    return await this.agentController.getTopRatedAgents();
  }

  /**
   * Get the total number of agents
   */
  async getAgentCount(): Promise<bigint> {
    return await this.agentController.countAgents();
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: bigint): Promise<Agent | null> {
    const agents = await this.getAllAgents();
    return agents.find(agent => agent.id === agentId) || null;
  }

  /**
   * Start monitoring events
   */
  async startEventMonitoring(options?: EventListenerOptions): Promise<void> {
    await this.eventMonitor.startMonitoring(options);
  }

  /**
   * Stop monitoring events
   */
  stopEventMonitoring(): void {
    this.eventMonitor.stopMonitoring();
  }

  /**
   * Get historical events
   */
  async getHistoricalEvents(options?: EventFilterOptions) {
    return await this.eventMonitor.getHistoricalEvents(options);
  }

  /**
   * Event listener methods
   */
  onAgentRegistered(callback: AgentRegisteredCallback): void {
    this.eventMonitor.onAgentRegistered(callback);
  }

  onMessageSent(callback: MessageSentCallback): void {
    this.eventMonitor.onMessageSent(callback);
  }

  onMessageResponded(callback: MessageRespondedCallback): void {
    this.eventMonitor.onMessageResponded(callback);
  }

  onAgentUpdated(callback: AgentUpdatedCallback): void {
    this.eventMonitor.onAgentUpdated(callback);
  }

  onAgentRated(callback: AgentRatedCallback): void {
    this.eventMonitor.onAgentRated(callback);
  }

  onTrustScoreUpdated(callback: TrustScoreUpdatedCallback): void {
    this.eventMonitor.onTrustScoreUpdated(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.eventMonitor.onError(callback);
  }

  /**
   * Get contract address
   */
  async getContractAddress(): Promise<string> {
    return await this.agentController.getAddress();
  }

  /**
   * Check if event monitoring is active
   */
  isMonitoringEvents(): boolean {
    return this.eventMonitor.isMonitoring();
  }

  /**
   * Get the current wallet address (if available)
   */
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  /**
   * Get the current provider
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Create a new SDK instance with a different contract address
   */
  withContract(contractAddress: string): AgentSDK {
    const config: SDKConfig = {
      rpcUrl: this.provider._getConnection().url,
      privateKey: this.wallet?.privateKey,
      contractAddress,
    };

    return new AgentSDK(config);
  }

  /**
   * Create a new SDK instance with a different wallet
   */
  withWallet(privateKey: string): AgentSDK {
    const config: SDKConfig = {
      rpcUrl: this.provider._getConnection().url,
      privateKey,
      contractAddress: this.agentController.contract.target as string,
    };

    return new AgentSDK(config);
  }
}
