---
name: spec-research
description: "[WORKFLOW] Research APIs, libraries, patterns on-demand through web search and documentation analysis (fully parallelizable, stateless)"
when_to_use: When answering open questions from specification or plan that require external research
version: 1.0.0
type: workflow
---

**Input**: Research query (natural language question)
**Output**: `knowledge/[topic-slug]-YYYY-MM-DD.md`

---

## Process

### Step 1: Generate Filename

```typescript
const slug = query.toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '');
const date = new Date().toISOString().split('T')[0];
const filename = `knowledge/${slug}-${date}.md`;
```

**Example:**
- Query: "HuggingFace API rate limits"
- Filename: `knowledge/huggingface-api-rate-limits-2025-01-15.md`

---

### Step 2: Check If Research Exists

```bash
# Search for similar research
Grep: knowledge/*.md --pattern "[key terms from query]"

# If found existing research:
Read: knowledge/[existing-file].md
# Return summary to orchestrator
# Skip research (avoid duplicate work)

# If not found:
# Proceed with research
```

---

### Step 3: Research Strategy

**Classify query → Use appropriate tool:**

#### For API Documentation
```bash
# Use Context7 for official API docs
Context7: [API name]

# Example:
Query: "HuggingFace API rate limits"
Tool: Context7 "HuggingFace Hub API"
Returns: Rate limits, authentication, endpoints
```

#### For Patterns/Best Practices
```bash
# Use Perplexity for patterns and formulas
Perplexity: [query]

# Example:
Query: "GPU VRAM calculation for FP16 inference"
Tool: Perplexity "GPU VRAM estimation formulas FP16 inference"
Returns: Formulas, benchmarks, references
```

#### For Library Documentation
```bash
# Use WebFetch for library docs
WebFetch: [official docs URL]
Prompt: [what to extract]

# Example:
Query: "Convex search performance at scale"
Tool: WebFetch "https://docs.convex.dev/search"
Prompt: "Extract performance characteristics, benchmarks, best practices"
```

#### For General Search
```bash
# Use WebSearch as fallback
WebSearch: [query]

# Only if above tools don't apply
```

---

### Step 4: Synthesize Research

**Structure:**

```markdown
# [Topic]

**Research Date**: YYYY-MM-DD
**Query**: [Original question]

## Summary

[3-5 bullet points of key findings]

## Detailed Findings

### Finding 1: [Heading]

[Detailed explanation]

**Example**:
[Code example if applicable]

### Finding 2: [Heading]

[Detailed explanation]

### Finding 3: [Heading]

[Detailed explanation]

## Code Examples

```typescript
// Executable code example
[code]
```

## References

- [Source 1 with URL]
- [Source 2 with URL]
- [Source 3 with URL]
```

---

### Step 5: Write File

```bash
Write: knowledge/[topic-slug]-YYYY-MM-DD.md
```

---

### Step 6: Return to Orchestrator

**Return structure:**

```json
{
  "query": "HuggingFace API rate limits",
  "summary": [
    "5,000 requests/hour for authenticated users",
    "429 error indicates rate limit exceeded",
    "Use caching to reduce API calls"
  ],
  "file": "knowledge/huggingface-api-rate-limits-2025-01-15.md",
  "status": "completed"
}
```

**Orchestrator uses this to:**
- Reference research in plan
- Aggregate multiple research results
- Provide research links to implementers

---

## Parallel Dispatch Pattern

**Orchestrator dispatches multiple researchers:**

```markdown
# From spec-plan skill:

Task 1: spec-research
  Query: "HuggingFace API rate limits"
  Save to: knowledge/huggingface-api-rate-limits-2025-01-15.md

Task 2: spec-research
  Query: "GPU VRAM estimation formulas"
  Save to: knowledge/gpu-vram-estimation-2025-01-15.md

Task 3: spec-research
  Query: "Convex search performance benchmarks"
  Save to: knowledge/convex-search-performance-2025-01-15.md

# Each researcher is stateless, fully independent
# Orchestrator waits for all to complete (fan-in)
# Aggregates results, references files in plan
```

**Key properties:**
- **Stateless**: No shared state between researchers
- **Independent**: Each can complete without others
- **Parallel**: All run concurrently (3× faster than sequential)

---

## Quality Checks

- ✅ Summary has 3-5 key findings
- ✅ Details answer the research question
- ✅ Code examples are executable (if applicable)
- ✅ References include URLs to sources
- ✅ File saved to correct location (knowledge/*.md)

---

## Examples

### Example 1: API Rate Limits

**Query**: "HuggingFace API rate limits for model metadata"

**Tool**: Context7 "HuggingFace Hub API"

**Output** (knowledge/huggingface-api-rate-limits-2025-01-15.md):

```markdown
# HuggingFace API Rate Limits

**Research Date**: 2025-01-15
**Query**: HuggingFace API rate limits for model metadata

## Summary

- 5,000 requests/hour for authenticated users
- 1,000 requests/hour for unauthenticated
- 429 HTTP status on rate limit exceeded
- Rate limit resets hourly
- Use caching to minimize API calls

## Detailed Findings

### Rate Limit Tiers

**Authenticated** (with API token):
- 5,000 requests/hour
- Recommended for production use

**Unauthenticated**:
- 1,000 requests/hour
- For testing only

### Error Handling

When rate limited:
- Response: HTTP 429
- Header: `X-RateLimit-Remaining: 0`
- Header: `X-RateLimit-Reset: <timestamp>`

**Best practice**: Implement exponential backoff

## Code Examples

```typescript
async function fetchModelMetadata(modelId: string) {
  const response = await fetch(
    `https://huggingface.co/api/models/${modelId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`
      }
    }
  );

  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    throw new Error(`Rate limited until ${resetTime}`);
  }

  return response.json();
}
```

## References

- HuggingFace API Docs: https://huggingface.co/docs/hub/api
- Rate Limiting Guide: https://huggingface.co/docs/hub/rate-limits
```

---

### Example 2: Performance Benchmarks

**Query**: "Convex search performance at 10K+ records"

**Tool**: WebFetch "https://docs.convex.dev/search"

**Output** (knowledge/convex-search-performance-2025-01-15.md):

```markdown
# Convex Search Performance

**Research Date**: 2025-01-15
**Query**: Convex search performance at 10K+ records

## Summary

- Full-text search scales to 100K+ documents
- p95 latency <50ms for indexed searches
- Use pagination for large result sets
- Search indexes update in real-time

## Detailed Findings

### Performance Characteristics

**Small datasets** (<1K documents):
- Latency: <10ms
- No pagination needed

**Medium datasets** (1K-10K):
- Latency: <25ms
- Pagination recommended

**Large datasets** (10K-100K+):
- Latency: <50ms p95
- Pagination required
- Use filters to narrow results

### Best Practices

1. **Add search index** to schema
2. **Filter before search** (use indexed fields)
3. **Paginate results** (100 per page)
4. **Cache frequent queries**

## Code Examples

```typescript
// Schema with search index
models: defineTable({
  model_name: v.string(),
  vendor_name: v.string()
})
.searchIndex("search_models", {
  searchField: "model_name",
  filterFields: ["vendor_name"]
});

// Query with pagination
export const searchModels = query({
  args: {
    searchTerm: v.string(),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("models")
      .withSearchIndex("search_models", q =>
        q.search("model_name", args.searchTerm)
      )
      .paginate(args.paginationOpts);
  }
});
```

## References

- Convex Search Docs: https://docs.convex.dev/search
- Performance Guide: https://docs.convex.dev/production/best-practices
```

---

**Usage**: Dispatched by spec-plan skill for parallel research
