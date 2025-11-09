/**
 * Phase Validation Script Template
 *
 * Usage: Copy this file to scripts/validate-phase-N.ts and customize
 *
 * Purpose: Consolidate all validation checks into one executable
 * Benefits:
 *  - Saves 10K-20K tokens (script output vs multiple MCP queries)
 *  - Reusable across phases
 *  - Concise, actionable output
 *  - Faster execution
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function validatePhase() {
  console.log("🧪 Phase N Validation\n");

  let passCount = 0;
  let failCount = 0;

  // ========================================
  // CUSTOMIZE BELOW FOR YOUR PHASE
  // ========================================

  // Validation 1: Database State
  try {
    console.log("📊 Checking database state...");

    // TODO: Replace with your actual query
    const entities = await client.query(api.queries.getEntities.getEntities);
    const hasData = entities.length > 0;

    if (hasData) {
      console.log(`   ✅ Database populated (${entities.length} entities)\n`);
      passCount++;
    } else {
      console.log(`   ❌ Database empty - expected data\n`);
      failCount++;
    }
  } catch (error: any) {
    console.error(`   ❌ Database check failed: ${error.message}\n`);
    failCount++;
  }

  // Validation 2: Query Logic
  try {
    console.log("🔍 Testing query logic...");

    // TODO: Replace with your actual query and params
    const result = await client.query(api.queries.testQuery.testQuery, {
      param: "test-value"
    });

    // TODO: Customize validation logic
    if (result.success) {
      console.log(`   ✅ Query returns expected result\n`);
      passCount++;
    } else {
      console.log(`   ❌ Query returned unexpected result\n`);
      failCount++;
    }
  } catch (error: any) {
    console.error(`   ❌ Query test failed: ${error.message}\n`);
    failCount++;
  }

  // Validation 3: API Endpoint
  try {
    console.log("🌐 Testing API endpoint...");

    // TODO: Replace with your actual API endpoint and payload
    const response = await fetch('http://localhost:8765/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ API endpoint working (${response.status})\n`);
      passCount++;
    } else {
      console.log(`   ❌ API endpoint failed (${response.status})\n`);
      failCount++;
    }
  } catch (error: any) {
    console.error(`   ❌ API test failed: ${error.message}\n`);
    failCount++;
  }

  // ========================================
  // ADD MORE VALIDATIONS AS NEEDED
  // ========================================

  // Summary
  console.log("📊 Validation Summary");
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (failCount === 0) {
    console.log("\n✅ All validation checks passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some validation checks failed");
    process.exit(1);
  }
}

validatePhase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
