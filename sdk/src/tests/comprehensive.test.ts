import { AgentSDK, AgentRole } from '../index.js';
import { NETWORKS, getNetwork } from '../config/networks.js';

/**
 * Comprehensive test suite for the DAI Agents SDK
 */

// Test configuration
const TEST_CONFIG = {
  // Use environment variables or fallback to test values
  privateKey: process.env.TEST_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000',
  testNetworks: ['seiTestnet', 'sepolia', 'localhost'],
  skipNetworkTests: process.env.SKIP_NETWORK_TESTS === 'true',
  deploymentTimeout: 60000, // 1 minute
  operationTimeout: 30000,  // 30 seconds
};

/**
 * Test 1: Basic SDK functionality
 */
async function testBasicFunctionality() {
  console.log('🧪 Test 1: Basic SDK functionality');
  
  try {
    // Test enum values
    console.log('✅ AgentRole enum values:');
    console.log(`   - Agent: ${AgentRole.Agent}`);
    console.log(`   - Chat: ${AgentRole.Chat}`);

    // Test network configurations
    console.log('✅ Network configurations loaded:');
    const testnetCount = Object.values(NETWORKS).filter(n => n.testnet).length;
    const mainnetCount = Object.values(NETWORKS).filter(n => !n.testnet).length;
    console.log(`   - Testnets: ${testnetCount}`);
    console.log(`   - Mainnets: ${mainnetCount}`);

    // Test network lookup
    const seiNetwork = getNetwork('seiTestnet');
    if (seiNetwork) {
      console.log(`✅ Sei Testnet config: ${seiNetwork.name} (Chain ID: ${seiNetwork.chainId})`);
    }

    console.log('✅ Test 1 passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    return false;
  }
}

/**
 * Test 2: Contract deployment on testnet
 */
async function testContractDeployment(networkName: string) {
  console.log(`🧪 Test 2: Contract deployment on ${networkName}`);
  
  if (TEST_CONFIG.skipNetworkTests) {
    console.log('⏭️  Skipping network tests (SKIP_NETWORK_TESTS=true)\n');
    return true;
  }

  try {
    const network = getNetwork(networkName);
    if (!network) {
      throw new Error(`Network ${networkName} not found`);
    }

    console.log(`📡 Deploying to ${network.name} (${network.rpcUrl})`);
    
    const deployConfig = {
      rpcUrl: network.rpcUrl,
      privateKey: TEST_CONFIG.privateKey,
      chainId: network.chainId,
    };

    // Deploy contract with timeout
    const deployPromise = AgentSDK.deployController(deployConfig);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Deployment timeout')), TEST_CONFIG.deploymentTimeout)
    );

    const sdk = await Promise.race([deployPromise, timeoutPromise]) as AgentSDK;
    const contractAddress = await sdk.getContractAddress();
    
    console.log(`✅ Contract deployed at: ${contractAddress}`);
    
    if (network.blockExplorer) {
      console.log(`🔍 View on explorer: ${network.blockExplorer}/address/${contractAddress}`);
    }

    console.log(`✅ Test 2 passed for ${networkName}!\n`);
    return { sdk, contractAddress };
  } catch (error) {
    console.error(`❌ Test 2 failed for ${networkName}:`, error);
    return false;
  }
}

/**
 * Test 3: Agent registration and management
 */
async function testAgentOperations(sdk: AgentSDK, networkName: string) {
  console.log(`🧪 Test 3: Agent operations on ${networkName}`);
  
  try {
    // Register first agent
    console.log('📝 Registering first agent...');
    const agent1Result = await sdk.createNewAgent({
      name: 'Test Chat Agent',
      role: AgentRole.Chat,
      ipfsHash: 'QmTestHash1234567890abcdef',
    });

    console.log(`✅ Agent 1 registered with ID: ${agent1Result.agentId}`);
    console.log(`📄 Transaction: ${agent1Result.transactionHash}`);

    // Register second agent
    console.log('📝 Registering second agent...');
    const agent2Result = await sdk.createNewAgent({
      name: 'Test Tool Agent',
      role: AgentRole.Agent,
      ipfsHash: 'QmTestHash0987654321fedcba',
    });

    console.log(`✅ Agent 2 registered with ID: ${agent2Result.agentId}`);

    // List all agents
    console.log('📋 Listing all agents...');
    const allAgents = await sdk.getAllAgents();
    console.log(`✅ Found ${allAgents.length} agents:`);
    allAgents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ID: ${agent.id}, Name: ${agent.name}, Role: ${AgentRole[agent.role]}`);
    });

    // Get agent count
    const agentCount = await sdk.getAgentCount();
    console.log(`✅ Agent count: ${agentCount}`);

    console.log(`✅ Test 3 passed for ${networkName}!\n`);
    return { agent1: agent1Result, agent2: agent2Result, allAgents };
  } catch (error) {
    console.error(`❌ Test 3 failed for ${networkName}:`, error);
    return false;
  }
}

/**
 * Test 4: Message communication
 */
async function testMessageCommunication(sdk: AgentSDK, agent1Id: bigint, agent2Id: bigint, networkName: string) {
  console.log(`🧪 Test 4: Message communication on ${networkName}`);
  
  try {
    // Send message from agent 1 to agent 2
    console.log('💬 Sending message from agent 1 to agent 2...');
    const messageResult = await sdk.sendMessage({
      agentId: agent2Id,
      message: 'Hello from Agent 1! How are you doing?',
    });

    console.log(`✅ Message sent with ID: ${messageResult.messageId}`);
    console.log(`📄 Transaction: ${messageResult.transactionHash}`);

    // Respond to the message (would need different wallet for agent 2 in real scenario)
    console.log('💬 Sending response from agent 2 to agent 1...');
    const responseResult = await sdk.respondToMessage({
      messageId: messageResult.messageId,
      receiverAgentId: agent1Id,
      response: 'Hello back from Agent 2! I am doing great, thanks for asking!',
    });

    console.log(`✅ Response sent. Transaction: ${responseResult.transactionHash}`);

    console.log(`✅ Test 4 passed for ${networkName}!\n`);
    return { messageId: messageResult.messageId, responseHash: responseResult.transactionHash };
  } catch (error) {
    console.error(`❌ Test 4 failed for ${networkName}:`, error);
    return false;
  }
}

/**
 * Test 5: Event monitoring
 */
async function testEventMonitoring(sdk: AgentSDK, networkName: string) {
  console.log(`🧪 Test 5: Event monitoring on ${networkName}`);
  
  try {
    // Set up event listeners
    let eventsReceived = {
      agentRegistered: 0,
      messageSent: 0,
      messageResponded: 0,
    };

    sdk.onAgentRegistered((event) => {
      eventsReceived.agentRegistered++;
      console.log(`📡 AgentRegistered event: Agent ${event.agentId} (${event.name})`);
    });

    sdk.onMessageSent((event) => {
      eventsReceived.messageSent++;
      console.log(`📡 MessageSent event: Message ${event.messageId}`);
    });

    sdk.onMessageResponded((event) => {
      eventsReceived.messageResponded++;
      console.log(`📡 MessageResponded event: Message ${event.messageId}`);
    });

    sdk.onError((error) => {
      console.error('📡 Event monitoring error:', error);
    });

    // Start monitoring
    console.log('📡 Starting event monitoring...');
    await sdk.startEventMonitoring({
      fromBlock: 'latest',
      pollInterval: 2000, // Poll every 2 seconds
    });

    console.log('✅ Event monitoring started');

    // Register a test agent to trigger events
    console.log('📝 Registering test agent to trigger events...');
    await sdk.createNewAgent({
      name: 'Event Test Agent',
      role: AgentRole.Chat,
      ipfsHash: 'QmEventTestHash123',
    });

    // Wait for events to be processed
    console.log('⏳ Waiting for events to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Stop monitoring
    sdk.stopEventMonitoring();
    console.log('✅ Event monitoring stopped');

    console.log(`📊 Events received: ${JSON.stringify(eventsReceived, null, 2)}`);
    console.log(`✅ Test 5 passed for ${networkName}!\n`);
    return eventsReceived;
  } catch (error) {
    console.error(`❌ Test 5 failed for ${networkName}:`, error);
    return false;
  }
}

/**
 * Test 6: Historical events
 */
async function testHistoricalEvents(sdk: AgentSDK, networkName: string) {
  console.log(`🧪 Test 6: Historical events on ${networkName}`);
  
  try {
    console.log('📚 Fetching historical events...');
    const events = await sdk.getHistoricalEvents({
      fromBlock: 0,
      toBlock: 'latest',
    });

    console.log('📊 Historical events summary:');
    console.log(`   - Agent registrations: ${events.agentRegistered.length}`);
    console.log(`   - Messages sent: ${events.messageSent.length}`);
    console.log(`   - Messages responded: ${events.messageResponded.length}`);
    console.log(`   - Agent updates: ${events.agentUpdated.length}`);

    // Show recent events
    if (events.agentRegistered.length > 0) {
      console.log('📋 Recent agent registrations:');
      events.agentRegistered.slice(-3).forEach((event, index) => {
        console.log(`   ${index + 1}. Agent ${event.agentId}: ${event.name} (${event.role})`);
      });
    }

    console.log(`✅ Test 6 passed for ${networkName}!\n`);
    return events;
  } catch (error) {
    console.error(`❌ Test 6 failed for ${networkName}:`, error);
    return false;
  }
}

/**
 * Run comprehensive test suite
 */
async function runComprehensiveTests() {
  console.log('🚀 Starting DAI Agents SDK Comprehensive Test Suite\n');
  console.log('=' .repeat(60));
  
  const results = {
    basicFunctionality: false,
    deployments: {} as Record<string, any>,
    operations: {} as Record<string, any>,
    communication: {} as Record<string, any>,
    eventMonitoring: {} as Record<string, any>,
    historicalEvents: {} as Record<string, any>,
  };

  // Test 1: Basic functionality
  results.basicFunctionality = await testBasicFunctionality();

  // Test 2-6: Network-specific tests
  for (const networkName of TEST_CONFIG.testNetworks) {
    console.log(`🌐 Testing on network: ${networkName}`);
    console.log('-'.repeat(40));

    // Deploy contract
    const deployResult = await testContractDeployment(networkName);
    if (!deployResult || deployResult === true) {
      console.log(`⏭️  Skipping remaining tests for ${networkName}\n`);
      continue;
    }

    results.deployments[networkName] = deployResult;
    const { sdk } = deployResult as any;

    // Test agent operations
    const operationsResult = await testAgentOperations(sdk, networkName);
    if (operationsResult) {
      results.operations[networkName] = operationsResult;
      const { agent1, agent2 } = operationsResult as any;

      // Test message communication
      const communicationResult = await testMessageCommunication(
        sdk, 
        agent1.agentId, 
        agent2.agentId, 
        networkName
      );
      if (communicationResult) {
        results.communication[networkName] = communicationResult;
      }

      // Test event monitoring
      const eventResult = await testEventMonitoring(sdk, networkName);
      if (eventResult) {
        results.eventMonitoring[networkName] = eventResult;
      }

      // Test historical events
      const historyResult = await testHistoricalEvents(sdk, networkName);
      if (historyResult) {
        results.historicalEvents[networkName] = historyResult;
      }
    }

    console.log(`✅ Completed tests for ${networkName}\n`);
  }

  // Print final results
  console.log('=' .repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(60));
  
  console.log(`✅ Basic Functionality: ${results.basicFunctionality ? 'PASSED' : 'FAILED'}`);
  
  for (const networkName of TEST_CONFIG.testNetworks) {
    console.log(`\n🌐 ${networkName.toUpperCase()}:`);
    console.log(`   Deployment: ${results.deployments[networkName] ? 'PASSED' : 'FAILED'}`);
    console.log(`   Operations: ${results.operations[networkName] ? 'PASSED' : 'FAILED'}`);
    console.log(`   Communication: ${results.communication[networkName] ? 'PASSED' : 'FAILED'}`);
    console.log(`   Event Monitoring: ${results.eventMonitoring[networkName] ? 'PASSED' : 'FAILED'}`);
    console.log(`   Historical Events: ${results.historicalEvents[networkName] ? 'PASSED' : 'FAILED'}`);
  }

  const totalTests = 1 + (TEST_CONFIG.testNetworks.length * 5);
  const passedTests = Object.values(results).reduce((acc, result) => {
    if (typeof result === 'boolean') return acc + (result ? 1 : 0);
    return acc + Object.values(result).filter(Boolean).length;
  }, 0);

  console.log(`\n📈 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);
  console.log('🎉 Comprehensive test suite completed!');

  return results;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}

export {
  runComprehensiveTests,
  testBasicFunctionality,
  testContractDeployment,
  testAgentOperations,
  testMessageCommunication,
  testEventMonitoring,
  testHistoricalEvents,
};
