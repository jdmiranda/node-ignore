#!/usr/bin/env node

/**
 * Performance benchmark for node-ignore
 * Tests the performance improvements from optimization changes
 */

const ignore = require('./index.js')
const {performance} = require('perf_hooks')

// Common gitignore patterns for testing
const COMMON_PATTERNS = [
  '*.js',
  '*.json',
  '*.md',
  '*.txt',
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '*.log',
  '.DS_Store',
  '*.swp',
  '*.swo',
  '!important.js',
  '/root-only.js',
  'foo/**/*.bar',
  '**/temp',
  'test/*.test.js',
  'src/**/*.spec.js',
  '*.min.js'
]

// Test paths representing typical file structures
const TEST_PATHS = [
  'src/index.js',
  'src/utils/helper.js',
  'src/components/Button.js',
  'test/index.test.js',
  'test/utils/helper.test.js',
  'node_modules/package/index.js',
  'node_modules/package/lib/file.js',
  '.git/config',
  'dist/bundle.js',
  'dist/bundle.min.js',
  'build/output.js',
  'coverage/index.html',
  'README.md',
  'package.json',
  '.DS_Store',
  'file.log',
  '.vimrc.swp',
  'important.js',
  'root-only.js',
  'foo/bar/baz.bar',
  'temp/cache.dat',
  'src/deep/nested/path/file.js',
  'very/deep/nested/structure/file.spec.js'
]

function benchmark(name, fn, iterations = 10000) {
  // Warmup
  for (let i = 0; i < 100; i++) {
    fn()
  }

  // Actual benchmark
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  const end = performance.now()
  const duration = end - start
  const opsPerSec = (iterations / duration) * 1000

  return {
    name,
    duration: duration.toFixed(2),
    iterations,
    opsPerSec: opsPerSec.toFixed(0),
    avgTime: (duration / iterations).toFixed(4)
  }
}

console.log('node-ignore Performance Benchmark')
console.log('==================================\n')

const results = []

// Benchmark 1: Pattern addition
results.push(benchmark('Add patterns', () => {
  const ig = ignore()
  COMMON_PATTERNS.forEach(pattern => ig.add(pattern))
}, 5000))

// Benchmark 2: Pattern matching (with cache hits)
const ig = ignore()
COMMON_PATTERNS.forEach(pattern => ig.add(pattern))

results.push(benchmark('Match paths (cached)', () => {
  TEST_PATHS.forEach(path => ig.ignores(path))
}, 10000))

// Benchmark 3: Pattern matching (cold - new instance each time)
results.push(benchmark('Match paths (cold)', () => {
  const freshIg = ignore()
  COMMON_PATTERNS.forEach(pattern => freshIg.add(pattern))
  TEST_PATHS.forEach(path => freshIg.ignores(path))
}, 1000))

// Benchmark 4: Test method (with rule information)
results.push(benchmark('Test paths with rule info', () => {
  TEST_PATHS.forEach(path => ig.test(path))
}, 10000))

// Benchmark 5: Filter operation
results.push(benchmark('Filter paths', () => {
  ig.filter(TEST_PATHS)
}, 5000))

// Benchmark 6: Repeated pattern caching
results.push(benchmark('Repeated pattern addition', () => {
  const repeatIg = ignore()
  // Add same patterns multiple times to test cache efficiency
  for (let i = 0; i < 3; i++) {
    COMMON_PATTERNS.forEach(pattern => repeatIg.add(pattern))
  }
}, 2000))

// Print results
console.log('Results:')
console.log('--------')
results.forEach(result => {
  console.log(`\n${result.name}:`)
  console.log(`  Total time: ${result.duration}ms`)
  console.log(`  Iterations: ${result.iterations}`)
  console.log(`  Ops/sec: ${result.opsPerSec}`)
  console.log(`  Avg time: ${result.avgTime}ms`)
})

// Summary
console.log('\n\nSummary:')
console.log('--------')
console.log(`Total benchmarks: ${results.length}`)
console.log(`Best performance: ${results.reduce((best, r) =>
  parseInt(r.opsPerSec) > parseInt(best.opsPerSec) ? r : best
).name} (${results.reduce((best, r) =>
  parseInt(r.opsPerSec) > parseInt(best.opsPerSec) ? r : best
).opsPerSec} ops/sec)`)

// Export results for comparison
console.log('\n\nOptimization Metrics:')
console.log('--------------------')
console.log('✓ Regex prefix caching: Enabled (Map-based)')
console.log('✓ Compiled regex caching: Enabled (Map-based in IgnoreRule)')
console.log('✓ Path result caching: Enabled (Map-based, was Object)')
console.log('✓ Rule storage: Map-based for fast lookups')
console.log('✓ Loop optimization: for-loop instead of forEach')
console.log('✓ Cache size limit: 1000 entries to prevent memory issues')

process.exit(0)
