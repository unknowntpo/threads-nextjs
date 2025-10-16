# Collaborative Filtering - Concept Guide

## Core Idea

"People who liked similar posts as you will probably like other posts you haven't seen"

## How It Works

### 1. Build User-Item Matrix

Located in `app/infrastructure/ml/collaborative_filter.py:37-59`

```
         Post1  Post2  Post3
User1:     5      0      3
User2:     4      2      0
User3:     0      3      5
```

- Rows = users, Columns = posts
- Numbers = interaction weights:
  - Like = 1
  - Comment = 2
  - Share = 3
- 0 = no interaction

### 2. Find Similar Users

Uses KNN (K-Nearest Neighbors) with cosine similarity (`collaborative_filter.py:78`)

- If you liked Post1 & Post3
- Find users with similar pattern (User1 in example above)
- Ignore users who liked totally different posts

### 3. Recommend Posts

Process (`collaborative_filter.py:88-110`):

1. Look at what similar users liked that you haven't seen
2. Weight by similarity (more similar users = higher score)
3. Sort by score, return top N

## Real Example

```
You: liked "Python tutorial", "React guide"
Similar user: liked "Python tutorial", "React guide", "TypeScript tips"
→ System recommends: "TypeScript tips" to you
```

## Key Metrics (tracked by MLflow)

- **matrix_sparsity**: % of empty cells (high = users interact with few posts)
- **avg_interactions_per_user**: how active users are
- **avg_interactions_per_post**: how popular posts are
- **n_neighbors**: how many similar users to check (default: 5)
- **n_users**: total unique users
- **n_posts**: total unique posts
- **n_interactions**: total interactions recorded

## Limitations

### Cold Start Problem

If user has no interactions → can't find similar users → returns empty `[]`

### Sparsity Problem

If matrix is too sparse (most cells = 0) → hard to find similar users

## Matrix Visualization

The system now visualizes the user-item matrix during training:

**Console Output:**

```
=== User-Item Matrix ===
Shape: (100, 250) (users x posts)

First 10 rows, 10 cols:
┌──────────┬────────┬────────┬────────┐
│ user_id  ┆ post_0 ┆ post_1 ┆ post_2 │
│ ---      ┆ ---    ┆ ---    ┆ ---    │
│ str      ┆ f64    ┆ f64    ┆ f64    │
╞══════════╪════════╪════════╪════════╡
│ user1    ┆ 5.0    ┆ 0.0    ┆ 3.0    │
│ user2    ┆ 0.0    ┆ 2.0    ┆ 1.0    │
└──────────┴────────┴────────┴────────┘
```

**Heatmap (logged to MLflow):**

- Yellow = low interaction
- Red = high interaction
- Darker = more sparse
- Visualizes up to 50x50 sample

**Technology Stack:**

- **Polars**: Fast DataFrame for data inspection/display
- **NumPy**: Numerical operations and KNN model training
- **Matplotlib/Seaborn**: Heatmap visualization
- **MLflow**: Artifact logging

## Analogy

Like Netflix recommendations - watches similar shows → suggests new shows.
