# Load Testing & A/B Test Architecture

## Overview

Generate synthetic realistic data to test ML recommendation system effectiveness.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Local Development (Claude Code)"
        LLM[Claude Code LLM]
        SeedGen[Generate 10 Seed Posts]
        SeedFile[seed_posts.json]

        LLM -->|Generate realistic content| SeedGen
        SeedGen -->|Save locally| SeedFile
    end

    subgraph "S3/Ozone Storage"
        S3Bucket[S3 Bucket: synthetic-data]
        S3Seeds[seeds/seed_posts.json]

        SeedFile -->|Upload| S3Seeds
    end

    subgraph "Dagster Pipeline (Synthetic Data Generator)"
        Scheduler[Dagster Scheduler]
        LoadGen[Load Generator Job]

        FetchSeeds[Fetch Seeds from S3]
        GenUsers[Generate Random Users]
        GenPosts[Generate 100+ Post Variations]
        GenInteractions[Generate User Interactions]

        Scheduler -->|Trigger| LoadGen
        LoadGen --> FetchSeeds
        FetchSeeds -->|Download| S3Seeds
        FetchSeeds --> GenUsers
        GenUsers --> GenPosts
        GenPosts --> GenInteractions
    end

    subgraph "Post Variation Generator"
        Seed[10 Seed Posts]
        Templates[Variation Templates]
        Multiplier[Multiply Logic]

        FetchSeeds --> Seed
        Seed --> Templates
        Templates -->|10 seeds × 10 variations| Multiplier
        Multiplier -->|100+ posts| GenPosts
    end

    subgraph "PostgreSQL Database"
        UsersTable[(users)]
        PostsTable[(posts)]
        InteractionsTable[(user_interactions)]

        GenUsers -->|Insert| UsersTable
        GenPosts -->|Insert| PostsTable
        GenInteractions -->|Insert| InteractionsTable
    end

    subgraph "ML Recommendation Pipeline"
        MLScheduler[Dagster ML Pipeline]
        BuildReco[Build Recommendations]
        RecoTable[(user_recommendations)]

        InteractionsTable -.->|Read interactions| BuildReco
        PostsTable -.->|Read posts| BuildReco
        MLScheduler -->|Daily 2AM| BuildReco
        BuildReco -->|Write| RecoTable
    end

    subgraph "A/B Test - Feed API"
        FeedAPI[GET /api/feeds]
        FeatureFlag{User Group?}
        ControlFeed[Random Feed]
        TreatmentFeed[ML Recommendations]

        FeedAPI --> FeatureFlag
        FeatureFlag -->|Control 50%| ControlFeed
        FeatureFlag -->|Treatment 50%| TreatmentFeed

        ControlFeed -.->|Random shuffle| PostsTable
        TreatmentFeed -.->|ML scores| RecoTable
    end

    style LLM fill:#9C27B0
    style S3Bucket fill:#FF9800
    style LoadGen fill:#2196F3
    style MLScheduler fill:#4CAF50
    style FeatureFlag fill:#F44336
```

## Components

### 1. Seed Post Generation (Claude Code - Local)

**Input:** Natural language prompts
**Output:** `seed_posts.json` (10 high-quality seed posts)

```json
{
  "seeds": [
    {
      "id": "seed_1",
      "topic": "technology",
      "content": "Just discovered this amazing new framework...",
      "tags": ["tech", "webdev", "react"],
      "tone": "enthusiastic"
    },
    {
      "id": "seed_2",
      "topic": "food",
      "content": "Made the best pasta carbonara today...",
      "tags": ["food", "cooking", "italian"],
      "tone": "casual"
    }
  ]
}
```

**Topics to Cover:**

- Technology (3 seeds)
- Food/Cooking (2 seeds)
- Travel (2 seeds)
- Sports (1 seed)
- Books/Learning (1 seed)
- Daily Life (1 seed)

### 2. S3/Ozone Upload

**Bucket Structure:**

```
synthetic-data/
├── seeds/
│   └── seed_posts.json
└── generated/
    └── run_YYYYMMDD_HHMMSS/
        ├── users.json
        ├── posts.json
        └── interactions.json
```

**S3 Configuration:**

- Provider: Ozone (S3-compatible)
- Bucket: `threads-synthetic-data`
- Access: Private, Dagster has read access

### 3. Dagster Load Generator Pipeline

**Job:** `generate_synthetic_data`

**Steps:**

```python
# Step 1: Fetch Seeds from S3
@asset
def seed_posts(s3_client):
    """Download seed posts from S3/Ozone"""
    seeds = s3_client.get_object(
        Bucket='threads-synthetic-data',
        Key='seeds/seed_posts.json'
    )
    return json.loads(seeds['Body'].read())

# Step 2: Generate Random Users (20-30 users)
@asset
def synthetic_users(seed_posts):
    """Create diverse user profiles based on post topics"""
    users = []
    for i in range(25):
        users.append({
            "username": f"user_{i:03d}",
            "display_name": faker.name(),
            "bio": faker.sentence(),
            "email": f"user{i}@synthetic.test"
        })
    return users

# Step 3: Generate Post Variations (100+ posts)
@asset
def synthetic_posts(seed_posts, synthetic_users):
    """
    Multiply seed posts using variation templates
    10 seeds × 10 variations = 100 posts
    """
    posts = []
    for seed in seed_posts:
        for i in range(10):
            variation = apply_template(seed, i)
            posts.append({
                "user_id": random.choice(synthetic_users)["id"],
                "content": variation,
                "created_at": fake_timestamp()
            })
    return posts

# Step 4: Generate User Interactions (500+ interactions)
@asset
def synthetic_interactions(synthetic_users, synthetic_posts):
    """
    Generate realistic interaction patterns:
    - Users interact more with posts in their topic interest
    - Power law distribution (some posts get more interactions)
    - Time-based decay (recent posts get more views)
    """
    interactions = []
    for user in synthetic_users:
        # Each user views 20-40 posts
        num_views = random.randint(20, 40)
        viewed_posts = random.sample(synthetic_posts, num_views)

        for post in viewed_posts:
            # View interaction
            interactions.append({
                "user_id": user["id"],
                "post_id": post["id"],
                "interaction_type": "view",
                "created_at": fake_timestamp()
            })

            # 30% chance of like
            if random.random() < 0.3:
                interactions.append({
                    "user_id": user["id"],
                    "post_id": post["id"],
                    "interaction_type": "like",
                    "created_at": fake_timestamp()
                })

    return interactions
```

### 4. Post Variation Templates

**Template Types:**

1. **Paraphrase** - Reword the content
2. **Add Context** - Add time/location details
3. **Add Emoji** - Insert relevant emojis
4. **Question Format** - Convert to question
5. **Personal Story** - Add personal angle
6. **Pro Tip** - Convert to advice format
7. **Short Form** - Condense to tweet-length
8. **Long Form** - Expand with details
9. **Casual Tone** - More informal
10. **Professional Tone** - More formal

**Example Variations:**

Seed: "Just discovered this amazing new framework..."

Variations:

1. "OMG just found this incredible framework! 🚀"
2. "Has anyone tried this new framework? Thoughts?"
3. "Pro tip: Check out this framework for your next project"
4. "Spent the weekend learning this framework. Mind blown!"
5. "Framework X is a game changer for web development"
   ... (10 total variations)

### 5. Feature Flag Implementation

**Database Change:**

```sql
ALTER TABLE users ADD COLUMN experiment_group VARCHAR(20) DEFAULT 'control';
-- Values: 'control' (random feed) or 'treatment' (ML feed)
```

**API Logic:**

```typescript
// app/api/feeds/route.ts
export async function GET(request: NextRequest) {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { experimentGroup: true },
  })

  if (user.experimentGroup === 'treatment') {
    // ML recommendations
    return fetchMLRecommendations(session.user.id, limit)
  } else {
    // Random feed (current Phase 1)
    return fetchRandomPosts(session.user.id, limit)
  }
}
```

### 6. Test Users Setup

**Create 2 Test Accounts:**

1. **User A (Control)** - `test_control@example.com`
   - `experiment_group` = 'control'
   - Gets random feed (Phase 1)

2. **User B (Treatment)** - `test_treatment@example.com`
   - `experiment_group` = 'treatment'
   - Gets ML recommendations (Phase 2)

**Visual Comparison:**

- Login as User A → See random posts
- Login as User B → See personalized ML recommendations
- Compare relevance by eye

## Implementation Timeline

### Phase 1: Seed Generation (Local - 30min)

- [ ] Write prompt for Claude Code to generate 10 seed posts
- [ ] Generate `seed_posts.json` locally
- [ ] Upload to S3/Ozone

### Phase 2: Dagster Load Generator (4h)

- [ ] Create Dagster job structure
- [ ] Implement S3 seed fetching
- [ ] Create user generator
- [ ] Create post variation templates
- [ ] Create interaction generator
- [ ] Test locally with small dataset

### Phase 3: Feature Flag (30min)

- [ ] Add `experiment_group` column to users table
- [ ] Update `/api/feeds` to check feature flag
- [ ] Create 2 test users (control/treatment)

### Phase 4: ML Pipeline (From existing plan)

- [ ] Build recommendation model
- [ ] Dagster ML job
- [ ] Populate `user_recommendations` table

### Phase 5: Visual Testing (15min)

- [ ] Login as User A → Random feed
- [ ] Login as User B → ML feed
- [ ] Compare results visually

## Success Criteria

✅ **Data Generation Working:**

- 10 high-quality seed posts
- 25+ synthetic users created
- 100+ post variations generated
- 500+ realistic interactions

✅ **A/B Test Working:**

- User A sees random posts
- User B sees ML-personalized posts
- Clear visual difference in relevance

✅ **ML Recommendations Working:**

- User B's feed matches their interaction history
- Posts ranked by predicted interest
- No duplicate recommendations

## Next Steps

1. **Now:** Draw architecture (this doc) ✅
2. **Next:** Generate 10 seed posts with Claude Code LLM
3. **Then:** Build Dagster load generator
4. **Finally:** Build ML recommendation pipeline
