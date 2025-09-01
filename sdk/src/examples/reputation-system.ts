import { AgentSDK, AgentRole, SDKConfig, DeploymentConfig } from "../index.js";

/**
 * Agent Reputation System Demo
 * - Creates multiple agents
 * - Demonstrates rating functionality
 * - Shows trust score tracking
 * - Lists top-rated agents
 *
 * Env vars required:
 * - RPC_URL: JSON-RPC endpoint
 * - PRIVATE_KEY: EOA private key with funds
 * - CONTRACT_ADDRESS: existing AgentController address (optional if DEPLOY_NEW=1)
 * - CHAIN_ID: chain id (required if deploying)
 * - DEPLOY_NEW: set to "1" to deploy a new controller
 */

async function getSdk(): Promise<AgentSDK> {
  const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const deployNew = process.env.DEPLOY_NEW === "1";

  if (!privateKey) throw new Error("PRIVATE_KEY is required");

  if (deployNew) {
    const chainId = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined;
    if (!chainId) throw new Error("CHAIN_ID is required when DEPLOY_NEW=1");

    const deployCfg: DeploymentConfig = { rpcUrl, privateKey, chainId };
    console.log("Deploying AgentController...");
    const sdk = await AgentSDK.deployController(deployCfg);
    console.log("Deployed at:", await sdk.getContractAddress());
    return sdk;
  }

  if (!contractAddress) throw new Error("CONTRACT_ADDRESS is required (or set DEPLOY_NEW=1)");

  const cfg: SDKConfig = { rpcUrl, privateKey, contractAddress };
  return new AgentSDK(cfg);
}

async function main() {
  console.log("🏆 Starting Agent Reputation System Demo...\n");

  const sdk = await getSdk();

  // Start event monitoring
  console.log("📡 Starting event monitoring...");
  await sdk.startEventMonitoring();

  // Listen to reputation events
  sdk.onAgentRated((event) => {
    console.log(`⭐ Agent ${event.agentId} rated ${event.positive ? 'POSITIVE' : 'NEGATIVE'} by Agent ${event.raterAgentId}`);
    if (event.comment) {
      console.log(`   Comment: "${event.comment}"`);
    }
  });

  sdk.onTrustScoreUpdated((event) => {
    console.log(`📊 Agent ${event.agentId} trust score updated to ${event.newTrustScore}% (${event.totalInteractions} total interactions)`);
  });

  console.log("\n🤖 Creating agents...");

  // Create multiple agents for demonstration
  const agent1 = await sdk.createNewAgent({
    name: "Customer Service Bot",
    role: AgentRole.Chat,
    ipfsHash: "QmServiceBot123"
  });
  console.log(`✅ Created Agent 1 (ID: ${agent1.agentId}): ${agent1.agent.name}`);

  const agent2 = await sdk.createNewAgent({
    name: "Data Analytics Agent",
    role: AgentRole.Agent,
    ipfsHash: "QmAnalyticsAgent456"
  });
  console.log(`✅ Created Agent 2 (ID: ${agent2.agentId}): ${agent2.agent.name}`);

  const agent3 = await sdk.createNewAgent({
    name: "Translation Assistant",
    role: AgentRole.Chat,
    ipfsHash: "QmTranslateBot789"
  });
  console.log(`✅ Created Agent 3 (ID: ${agent3.agentId}): ${agent3.agent.name}`);

  // Wait a moment for events to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("\n⭐ Starting reputation demo...");

  // Agent 1 rates Agent 2 positively
  console.log("\n📝 Agent 1 rating Agent 2 positively...");
  const rating1 = await sdk.rateAgent({
    agentId: agent2.agentId,
    positive: true,
    comment: "Excellent data analysis capabilities!"
  });
  console.log(`   Transaction: ${rating1.transactionHash}`);

  // Agent 3 rates Agent 2 positively
  console.log("\n📝 Agent 3 rating Agent 2 positively...");
  const rating2 = await sdk.rateAgent({
    agentId: agent2.agentId,
    positive: true,
    comment: "Very helpful with statistical insights"
  });
  console.log(`   Transaction: ${rating2.transactionHash}`);

  // Agent 1 rates Agent 3 negatively
  console.log("\n📝 Agent 1 rating Agent 3 negatively...");
  const rating3 = await sdk.rateAgent({
    agentId: agent3.agentId,
    positive: false,
    comment: "Translation accuracy needs improvement"
  });
  console.log(`   Transaction: ${rating3.transactionHash}`);

  // Wait for events to be processed
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("\n📊 Checking reputation scores...");

  // Get reputation for each agent
  const rep1 = await sdk.getAgentReputation(agent1.agentId);
  const rep2 = await sdk.getAgentReputation(agent2.agentId);
  const rep3 = await sdk.getAgentReputation(agent3.agentId);

  console.log(`\n🤖 Agent 1 (${agent1.agent.name}):`);
  console.log(`   Trust Score: ${rep1.trustScore}%`);
  console.log(`   Total Interactions: ${rep1.totalInteractions}`);
  console.log(`   Positive Ratings: ${rep1.positiveRatings}`);

  console.log(`\n🤖 Agent 2 (${agent2.agent.name}):`);
  console.log(`   Trust Score: ${rep2.trustScore}%`);
  console.log(`   Total Interactions: ${rep2.totalInteractions}`);
  console.log(`   Positive Ratings: ${rep2.positiveRatings}`);

  console.log(`\n🤖 Agent 3 (${agent3.agent.name}):`);
  console.log(`   Trust Score: ${rep3.trustScore}%`);
  console.log(`   Total Interactions: ${rep3.totalInteractions}`);
  console.log(`   Positive Ratings: ${rep3.positiveRatings}`);

  console.log("\n🏆 Top-rated agents:");
  const topAgents = await sdk.getTopRatedAgents();
  topAgents.forEach((agent, index) => {
    console.log(`   ${index + 1}. ${agent.name} - ${agent.trustScore}% trust score (${agent.totalInteractions} interactions)`);
  });

  console.log("\n✅ Reputation system demo completed!");
  
  // Check rating status
  console.log("\n🔍 Checking rating relationships...");
  const hasRated = await sdk.hasAgentRated(agent2.agentId, agent1.agentId);
  console.log(`   Agent 1 has rated Agent 2: ${hasRated}`);
  
  if (hasRated) {
    const rating = await sdk.getRating(agent2.agentId, agent1.agentId);
    console.log(`   Rating was: ${rating ? 'POSITIVE' : 'NEGATIVE'}`);
  }

  // Stop monitoring
  sdk.stopEventMonitoring();
  process.exit(0);
}

main().catch(console.error);
