/**
 * Comprehensive code quality validation template
 *
 * This is a TEMPLATE file from the spec-validate skill.
 * To use: Run the init script to copy and configure for your project.
 *
 * Auto-detects which validation tools are available in your project:
 * - TypeScript (tsc)
 * - Linting (ESLint, Prettier)
 * - Testing (Jest, Vitest, Playwright)
 * - Security (npm audit, yarn audit)
 * - Build (Next.js, Vite, etc.)
 *
 * Usage after initialization:
 *   npx tsx scripts/validate-code-quality.ts
 *   npx tsx scripts/validate-code-quality.ts --skip-tests
 *   npx tsx scripts/validate-code-quality.ts --cwd=apps/my-app
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  output?: string;
  error?: string;
  duration?: number;
}

interface ValidationOptions {
  skipTests?: boolean;
  skipBuild?: boolean;
  skipAudit?: boolean;
  skipFormatting?: boolean;
  workingDirectory?: string;
}

interface ProjectConfig {
  hasTypeScript: boolean;
  hasESLint: boolean;
  hasPrettier: boolean;
  testCommand: string | null;
  buildCommand: string | null;
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

/**
 * Auto-detect project configuration from package.json
 */
function detectProjectConfig(cwd: string): ProjectConfig {
  const packageJsonPath = join(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${cwd}`);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const scripts = packageJson.scripts || {};
  const devDeps = packageJson.devDependencies || {};
  const deps = packageJson.dependencies || {};

  return {
    hasTypeScript: existsSync(join(cwd, 'tsconfig.json')) || !!devDeps.typescript || !!deps.typescript,
    hasESLint: existsSync(join(cwd, '.eslintrc.json')) ||
               existsSync(join(cwd, '.eslintrc.js')) ||
               existsSync(join(cwd, 'eslint.config.js')) ||
               !!devDeps.eslint ||
               !!deps.eslint,
    hasPrettier: existsSync(join(cwd, '.prettierrc')) ||
                 existsSync(join(cwd, '.prettierrc.json')) ||
                 !!devDeps.prettier ||
                 !!deps.prettier,
    testCommand: scripts.test || null,
    buildCommand: scripts.build || null,
    packageManager: existsSync(join(cwd, 'yarn.lock')) ? 'yarn' :
                   existsSync(join(cwd, 'pnpm-lock.yaml')) ? 'pnpm' : 'npm',
  };
}

async function runCheck(
  name: string,
  command: string,
  options: {
    warnOnly?: boolean;
    skipIf?: () => boolean;
    cwd?: string;
  } = {}
): Promise<CheckResult> {
  const { warnOnly = false, skipIf, cwd } = options;

  if (skipIf && skipIf()) {
    console.log(`⏭️  ${name}: SKIPPED`);
    return { name, status: 'SKIP' };
  }

  const startTime = Date.now();

  try {
    console.log(`\n🔍 ${name}...`);
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: cwd || process.cwd(),
    });

    const duration = Date.now() - startTime;
    console.log(`✅ ${name}: PASSED (${duration}ms)`);
    return { name, status: 'PASS', output, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const errorOutput = err.stdout || err.stderr || err.message || 'Unknown error';

    if (warnOnly) {
      console.log(`⚠️  ${name}: WARNINGS FOUND (${duration}ms)`);
      if (errorOutput && errorOutput.trim()) {
        console.log(errorOutput.substring(0, 500)); // Show first 500 chars
      }
      return { name, status: 'WARN', error: errorOutput, duration };
    }

    console.log(`❌ ${name}: FAILED (${duration}ms)`);
    if (errorOutput && errorOutput.trim()) {
      console.log(errorOutput.substring(0, 1000)); // Show first 1000 chars
    }
    return { name, status: 'FAIL', error: errorOutput, duration };
  }
}

async function validateCodeQuality(options: ValidationOptions = {}) {
  const {
    skipTests = false,
    skipBuild = false,
    skipAudit = false,
    skipFormatting = false,
    workingDirectory,
  } = options;

  const cwd = workingDirectory || process.cwd();

  console.log('='.repeat(60));
  console.log('🧪 CODE QUALITY VALIDATION');
  console.log('='.repeat(60));
  console.log(`Working Directory: ${cwd}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  // Auto-detect project configuration
  const config = detectProjectConfig(cwd);
  console.log('📋 Detected Configuration:');
  console.log(`  TypeScript: ${config.hasTypeScript ? '✅' : '❌'}`);
  console.log(`  ESLint: ${config.hasESLint ? '✅' : '❌'}`);
  console.log(`  Prettier: ${config.hasPrettier ? '✅' : '❌'}`);
  console.log(`  Test Command: ${config.testCommand || '❌ None'}`);
  console.log(`  Build Command: ${config.buildCommand || '❌ None'}`);
  console.log(`  Package Manager: ${config.packageManager}\n`);

  const results: CheckResult[] = [];

  // Check 1: TypeScript Type Checking (if TypeScript project)
  if (config.hasTypeScript) {
    results.push(
      await runCheck('TypeScript Type Checking', 'npx tsc --noEmit', {
        cwd,
      })
    );
  } else {
    console.log('\n⏭️  TypeScript Type Checking: SKIPPED (not a TypeScript project)');
    results.push({ name: 'TypeScript Type Checking', status: 'SKIP' });
  }

  // Check 2: ESLint Code Quality (if ESLint configured)
  if (config.hasESLint) {
    results.push(
      await runCheck(
        'ESLint Code Quality',
        'npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0',
        {
          warnOnly: false, // Fail on any warnings
          cwd,
        }
      )
    );
  } else {
    console.log('\n⏭️  ESLint Code Quality: SKIPPED (ESLint not configured)');
    results.push({ name: 'ESLint Code Quality', status: 'SKIP' });
  }

  // Check 3: Security Audit (if not skipped)
  if (!skipAudit) {
    const auditCommand = config.packageManager === 'npm'
      ? 'npm audit --audit-level=high --production'
      : config.packageManager === 'yarn'
      ? 'yarn audit --level high'
      : 'pnpm audit --prod --audit-level high';

    results.push(
      await runCheck('Security Audit', auditCommand, {
        warnOnly: false, // FAIL on high/critical vulnerabilities
        cwd,
      })
    );
  }

  // Check 4: Unit Tests (if test command exists and not skipped)
  if (!skipTests && config.testCommand) {
    const testCommand = config.packageManager === 'npm'
      ? 'npm test -- --run'
      : config.packageManager === 'yarn'
      ? 'yarn test --run'
      : 'pnpm test --run';

    results.push(
      await runCheck('Unit Tests', testCommand, {
        cwd,
      })
    );
  } else if (!config.testCommand) {
    console.log('\n⏭️  Unit Tests: SKIPPED (no test command in package.json)');
    results.push({ name: 'Unit Tests', status: 'SKIP' });
  }

  // Check 5: Production Build (if build command exists and not skipped)
  if (!skipBuild && config.buildCommand) {
    const buildCommand = config.packageManager === 'npm'
      ? 'npm run build'
      : config.packageManager === 'yarn'
      ? 'yarn build'
      : 'pnpm build';

    results.push(
      await runCheck('Production Build', buildCommand, {
        cwd,
      })
    );
  } else if (!config.buildCommand) {
    console.log('\n⏭️  Production Build: SKIPPED (no build command in package.json)');
    results.push({ name: 'Production Build', status: 'SKIP' });
  }

  // Check 6: Code Formatting (if Prettier configured and not skipped)
  if (!skipFormatting && config.hasPrettier) {
    results.push(
      await runCheck('Code Formatting', 'npx prettier --check .', {
        warnOnly: true, // Don't fail on format issues, just warn
        cwd,
      })
    );
  } else if (!config.hasPrettier) {
    console.log('\n⏭️  Code Formatting: SKIPPED (Prettier not configured)');
    results.push({ name: 'Code Formatting', status: 'SKIP' });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARN').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⚠️  Warnings: ${warned}/${results.length}`);
  console.log(`⏭️  Skipped: ${skipped}/${results.length}`);

  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach((result) => {
    const icon =
      result.status === 'PASS'
        ? '✅'
        : result.status === 'FAIL'
        ? '❌'
        : result.status === 'WARN'
        ? '⚠️ '
        : '⏭️ ';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.name}: ${result.status}${duration}`);
  });

  // Performance summary
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(`\n⏱️  Total validation time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);

  // Exit status
  if (failed > 0) {
    console.log('\n❌ VALIDATION FAILED');
    console.log(`${failed} critical check(s) failed - fix before proceeding`);
    console.log('\nFailed checks:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  - ${r.name}`);
      });
    process.exit(1);
  } else if (warned > 0) {
    console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS');
    console.log(`${warned} warning(s) found - review recommended but not blocking`);
    console.log('\nWarnings:');
    results
      .filter((r) => r.status === 'WARN')
      .forEach((r) => {
        console.log(`  - ${r.name}`);
      });
    process.exit(0);
  } else {
    console.log('\n✅ ALL CHECKS PASSED');
    console.log('Code quality validation successful - ready for deployment');
    process.exit(0);
  }
}

// CLI interface
const args = process.argv.slice(2);
const options: ValidationOptions = {
  skipTests: args.includes('--skip-tests'),
  skipBuild: args.includes('--skip-build'),
  skipAudit: args.includes('--skip-audit'),
  skipFormatting: args.includes('--skip-formatting'),
  workingDirectory: args.find((arg) => arg.startsWith('--cwd='))?.split('=')[1],
};

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx tsx scripts/validate-code-quality.ts [options]

Auto-detects which validation tools are available in your project and runs them.

Options:
  --skip-tests        Skip unit test execution
  --skip-build        Skip production build verification
  --skip-audit        Skip security audit
  --skip-formatting   Skip code formatting check
  --cwd=<path>        Set working directory (default: current directory)
  --help, -h          Show this help message

Examples:
  # Run all available checks
  npx tsx scripts/validate-code-quality.ts

  # Skip tests and build (faster validation)
  npx tsx scripts/validate-code-quality.ts --skip-tests --skip-build

  # Run in specific directory (monorepo)
  npx tsx scripts/validate-code-quality.ts --cwd=apps/marketing

Exit codes:
  0 - All checks passed (or passed with warnings)
  1 - One or more checks failed
  `);
  process.exit(0);
}

validateCodeQuality(options).catch((error) => {
  console.error('\n❌ Validation script error:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
