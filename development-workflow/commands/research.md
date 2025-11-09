# /research Command

**Purpose**: Research APIs, patterns, libraries when needed (standalone research, not part of spec workflow)

**Usage**: `/research <query>`

**Example**: `/research How does Convex pagination work with large datasets?`

---

## Workflow

### Step 1: Check Existing Research

**Search existing knowledge files**:
```bash
Grep: knowledge/*.md --pattern "[topic keywords]"
```

**If found**:
- Read relevant files
- Show summary to user
- Ask: "Is this sufficient, or need updated research?"
- If sufficient → DONE
- If need update → Proceed to Step 2

**If not found**:
- Proceed directly to Step 2

---

### Step 2: Dispatch Research

**Load skill**: spec-research

**Input**: User's query

**Process**:
1. Classify query type:
   - API documentation → Use Context7
   - Best practices/patterns → Use Perplexity
   - Library documentation → Use WebFetch
   - General search → Use WebSearch

2. Dispatch researcher:
   ```
   Task: spec-research
     Query: [user's query]
     Save to: knowledge/[topic]-YYYY-MM-DD.md
   ```

3. Wait for completion

**Output**: knowledge/[topic-slug]-YYYY-MM-DD.md

---

### Step 3: Present Results

**Show user**:
- Summary (3-5 key findings)
- Link to full research file
- Ask: "Does this answer your question?"

**Example**:

```markdown
Research complete for "Convex pagination with large datasets":

**Key Findings**:
- Pagination scales to 100K+ documents
- p95 latency <50ms
- Use paginate() for result sets >1000
- Search indexes update in real-time
- Filter before search for best performance

**Full research**: knowledge/convex-pagination-large-datasets-2025-01-15.md

Does this answer your question?
```

---

## Examples

### Example 1: API Documentation

**Query**: `/research HuggingFace API rate limits`

**Tool**: Context7 "HuggingFace Hub API"

**Output**: knowledge/huggingface-api-rate-limits-2025-01-15.md

**Summary**:
- 5,000 requests/hour (authenticated)
- 429 errors indicate rate limit
- Use caching to reduce calls

---

### Example 2: Best Practices

**Query**: `/research Convex schema design patterns`

**Tool**: Perplexity "Convex database schema design best practices"

**Output**: knowledge/convex-schema-design-2025-01-15.md

**Summary**:
- Add indexes for all common queries
- Use compound indexes for multi-field filters
- Validate with Zod schemas
- Keep related data in same table

---

### Example 3: Performance

**Query**: `/research Convex search performance at scale`

**Tool**: WebFetch "https://docs.convex.dev/search/performance"

**Output**: knowledge/convex-search-performance-2025-01-15.md

**Summary**:
- Full-text search scales to 100K+ docs
- p95 latency <50ms
- Pagination required for large results
- Use filters to narrow searches

---

## Output Files

- knowledge/[topic-slug]-YYYY-MM-DD.md

**Note**: This research can be referenced later in specs/plans via Grep
