import { EventEmitter } from 'eventemitter3';
import { Contract, JsonRpcProvider, Log } from 'ethers';
import {
  AgentRegisteredEvent,
  MessageSentEvent,
  MessageRespondedEvent,
  AgentUpdatedEvent,
  AgentRatedEvent,
  TrustScoreUpdatedEvent,
  EventFilterOptions,
  EventListenerOptions,
  AgentRegisteredCallback,
  MessageSentCallback,
  MessageRespondedCallback,
  AgentUpdatedCallback,
  AgentRatedCallback,
  TrustScoreUpdatedCallback
} from './types.js';
import { AgentController } from './AgentController.js';

/**
 * Event names for the EventMonitor
 */
export enum EventNames {
  AGENT_REGISTERED = 'AgentRegistered',
  MESSAGE_SENT = 'MessageSent',
  MESSAGE_RESPONDED = 'MessageResponded',
  AGENT_UPDATED = 'AgentUpdated',
  AGENT_RATED = 'AgentRated',
  TRUST_SCORE_UPDATED = 'TrustScoreUpdated',
  ERROR = 'error'
}

/**
 * EventMonitor class for monitoring AgentController contract events
 */
export class EventMonitor extends EventEmitter {
  private agentController: AgentController;
  private isListening: boolean = false;
  private pollInterval: number = 5000; // 5 seconds default
  private lastProcessedBlock: number = 0;
  private intervalId?: NodeJS.Timeout;

  constructor(agentController: AgentController) {
    super();
    this.agentController = agentController;
  }

  /**
   * Start monitoring events
   */
  async startMonitoring(options: EventListenerOptions = {}): Promise<void> {
    if (this.isListening) {
      throw new Error('Event monitoring is already active');
    }

    this.pollInterval = options.pollInterval || 5000;
    
    // Set starting block
    if (options.fromBlock === 'latest') {
      this.lastProcessedBlock = await this.agentController.provider.getBlockNumber();
    } else if (typeof options.fromBlock === 'number') {
      this.lastProcessedBlock = options.fromBlock;
    } else {
      this.lastProcessedBlock = await this.agentController.provider.getBlockNumber();
    }

    this.isListening = true;
    this.startPolling();
  }

  /**
   * Stop monitoring events
   */
  stopMonitoring(): void {
    this.isListening = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Start polling for events
   */
  private startPolling(): void {
    this.intervalId = setInterval(async () => {
      try {
        await this.pollEvents();
      } catch (error) {
        this.emit(EventNames.ERROR, error);
      }
    }, this.pollInterval);
  }

  /**
   * Poll for new events
   */
  private async pollEvents(): Promise<void> {
    const currentBlock = await this.agentController.provider.getBlockNumber();
    
    if (currentBlock <= this.lastProcessedBlock) {
      return;
    }

    const fromBlock = this.lastProcessedBlock + 1;
    const toBlock = currentBlock;

    // Get all events from the contract
    const filter = {
      address: await this.agentController.getAddress(),
      fromBlock,
      toBlock
    };

    const logs = await this.agentController.provider.getLogs(filter);
    
    for (const log of logs) {
      await this.processLog(log);
    }

    this.lastProcessedBlock = currentBlock;
  }

  /**
   * Process a single log entry
   */
  private async processLog(log: Log): Promise<void> {
    try {
      const parsedLog = this.agentController.contract.interface.parseLog({
        topics: log.topics,
        data: log.data
      });

      if (!parsedLog) return;

      const baseEvent = {
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash
      };

      switch (parsedLog.name) {
        case 'AgentRegistered':
          const agentRegisteredEvent: AgentRegisteredEvent = {
            agentId: parsedLog.args.agentId,
            agentAddress: parsedLog.args.agentAddress,
            name: parsedLog.args.name,
            role: parsedLog.args.role,
            ipfsHash: parsedLog.args.ipfsHash,
            ...baseEvent
          };
          this.emit(EventNames.AGENT_REGISTERED, agentRegisteredEvent);
          break;

        case 'MessageSent':
          const messageSentEvent: MessageSentEvent = {
            messageId: parsedLog.args.messageId,
            senderAgentId: parsedLog.args.senderAgentId,
            receiverAgentId: parsedLog.args.receiverAgentId,
            message: parsedLog.args.message,
            ...baseEvent
          };
          this.emit(EventNames.MESSAGE_SENT, messageSentEvent);
          break;

        case 'MessageResponded':
          const messageRespondedEvent: MessageRespondedEvent = {
            messageId: parsedLog.args.messageId,
            senderAgentId: parsedLog.args.senderAgentId,
            receiverAgentId: parsedLog.args.receiverAgentId,
            response: parsedLog.args.response,
            ...baseEvent
          };
          this.emit(EventNames.MESSAGE_RESPONDED, messageRespondedEvent);
          break;

        case 'AgentUpdated':
          const agentUpdatedEvent: AgentUpdatedEvent = {
            agentId: parsedLog.args.agentId,
            name: parsedLog.args.name,
            role: parsedLog.args.role,
            ipfsHash: parsedLog.args.ipfsHash,
            ...baseEvent
          };
          this.emit(EventNames.AGENT_UPDATED, agentUpdatedEvent);
          break;

        case 'AgentRated':
          const agentRatedEvent: AgentRatedEvent = {
            agentId: parsedLog.args.agentId,
            raterAgentId: parsedLog.args.raterAgentId,
            positive: parsedLog.args.positive,
            comment: parsedLog.args.comment,
            ...baseEvent
          };
          this.emit(EventNames.AGENT_RATED, agentRatedEvent);
          break;

        case 'TrustScoreUpdated':
          const trustScoreUpdatedEvent: TrustScoreUpdatedEvent = {
            agentId: parsedLog.args.agentId,
            newTrustScore: parsedLog.args.newTrustScore,
            totalInteractions: parsedLog.args.totalInteractions,
            ...baseEvent
          };
          this.emit(EventNames.TRUST_SCORE_UPDATED, trustScoreUpdatedEvent);
          break;
      }
    } catch (error) {
      this.emit(EventNames.ERROR, error);
    }
  }

  /**
   * Get historical events
   */
  async getHistoricalEvents(options: EventFilterOptions = {}): Promise<{
    agentRegistered: AgentRegisteredEvent[];
    messageSent: MessageSentEvent[];
    messageResponded: MessageRespondedEvent[];
    agentUpdated: AgentUpdatedEvent[];
    agentRated: AgentRatedEvent[];
    trustScoreUpdated: TrustScoreUpdatedEvent[];
  }> {
    const fromBlock = options.fromBlock || 0;
    const toBlock = options.toBlock || 'latest';

    const filter = {
      address: await this.agentController.getAddress(),
      fromBlock,
      toBlock
    };

    const logs = await this.agentController.provider.getLogs(filter);
    
    const events = {
      agentRegistered: [] as AgentRegisteredEvent[],
      messageSent: [] as MessageSentEvent[],
      messageResponded: [] as MessageRespondedEvent[],
      agentUpdated: [] as AgentUpdatedEvent[],
      agentRated: [] as AgentRatedEvent[],
      trustScoreUpdated: [] as TrustScoreUpdatedEvent[]
    };

    for (const log of logs) {
      try {
        const parsedLog = this.agentController.contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (!parsedLog) continue;

        const baseEvent = {
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        };

        switch (parsedLog.name) {
          case 'AgentRegistered':
            if (!options.agentId || parsedLog.args.agentId === options.agentId) {
              events.agentRegistered.push({
                agentId: parsedLog.args.agentId,
                agentAddress: parsedLog.args.agentAddress,
                name: parsedLog.args.name,
                role: parsedLog.args.role,
                ipfsHash: parsedLog.args.ipfsHash,
                ...baseEvent
              });
            }
            break;

          case 'MessageSent':
            if (this.matchesMessageFilter(parsedLog.args, options)) {
              events.messageSent.push({
                messageId: parsedLog.args.messageId,
                senderAgentId: parsedLog.args.senderAgentId,
                receiverAgentId: parsedLog.args.receiverAgentId,
                message: parsedLog.args.message,
                ...baseEvent
              });
            }
            break;

          case 'MessageResponded':
            if (this.matchesMessageFilter(parsedLog.args, options)) {
              events.messageResponded.push({
                messageId: parsedLog.args.messageId,
                senderAgentId: parsedLog.args.senderAgentId,
                receiverAgentId: parsedLog.args.receiverAgentId,
                response: parsedLog.args.response,
                ...baseEvent
              });
            }
            break;

          case 'AgentUpdated':
            if (!options.agentId || parsedLog.args.agentId === options.agentId) {
              events.agentUpdated.push({
                agentId: parsedLog.args.agentId,
                name: parsedLog.args.name,
                role: parsedLog.args.role,
                ipfsHash: parsedLog.args.ipfsHash,
                ...baseEvent
              });
            }
            break;

          case 'AgentRated':
            if (!options.agentId || parsedLog.args.agentId === options.agentId) {
              events.agentRated.push({
                agentId: parsedLog.args.agentId,
                raterAgentId: parsedLog.args.raterAgentId,
                positive: parsedLog.args.positive,
                comment: parsedLog.args.comment,
                ...baseEvent
              });
            }
            break;

          case 'TrustScoreUpdated':
            if (!options.agentId || parsedLog.args.agentId === options.agentId) {
              events.trustScoreUpdated.push({
                agentId: parsedLog.args.agentId,
                newTrustScore: parsedLog.args.newTrustScore,
                totalInteractions: parsedLog.args.totalInteractions,
                ...baseEvent
              });
            }
            break;
        }
      } catch (error) {
        // Skip invalid logs
        continue;
      }
    }

    return events;
  }

  /**
   * Check if message event matches filter criteria
   */
  private matchesMessageFilter(args: any, options: EventFilterOptions): boolean {
    if (options.messageId && args.messageId !== options.messageId) {
      return false;
    }
    if (options.senderAgentId && args.senderAgentId !== options.senderAgentId) {
      return false;
    }
    if (options.receiverAgentId && args.receiverAgentId !== options.receiverAgentId) {
      return false;
    }
    return true;
  }

  /**
   * Convenience methods for adding event listeners
   */
  onAgentRegistered(callback: AgentRegisteredCallback): void {
    this.on(EventNames.AGENT_REGISTERED, callback);
  }

  onMessageSent(callback: MessageSentCallback): void {
    this.on(EventNames.MESSAGE_SENT, callback);
  }

  onMessageResponded(callback: MessageRespondedCallback): void {
    this.on(EventNames.MESSAGE_RESPONDED, callback);
  }

  onAgentUpdated(callback: AgentUpdatedCallback): void {
    this.on(EventNames.AGENT_UPDATED, callback);
  }

  onAgentRated(callback: AgentRatedCallback): void {
    this.on(EventNames.AGENT_RATED, callback);
  }

  onTrustScoreUpdated(callback: TrustScoreUpdatedCallback): void {
    this.on(EventNames.TRUST_SCORE_UPDATED, callback);
  }

  onError(callback: (error: Error) => void): void {
    this.on(EventNames.ERROR, callback);
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.isListening;
  }
}
