⏺ Collaborative Filtering - Simple Explanation

Core Idea: "People who liked similar posts as you will probably like other posts you
haven't seen"

How It Works (using your code):

1. Build User-Item Matrix (collaborative_filter.py:37-59)
   Post1 Post2 Post3
   User1: 5 0 3
   User2: 4 2 0
   User3: 0 3 5

- Rows = users, Columns = posts
- Numbers = interaction weights (likes=1, comments=2, shares=3, etc)
- 0 = no interaction

2. Find Similar Users (collaborative_filter.py:78)
   Uses KNN (K-Nearest Neighbors) with cosine similarity:

- If you liked Post1 & Post3
- Find users with similar pattern (User1 in example above)
- Ignore users who liked totally different posts

3. Recommend Posts (collaborative_filter.py:88-110)

- Look at what similar users liked that you haven't seen
- Weight by similarity (more similar users = higher score)
- Sort by score, return top N

Real Example:

You: liked "Python tutorial", "React guide"
Similar user: liked "Python tutorial", "React guide", "TypeScript tips"
→ System recommends: "TypeScript tips" to you

Key Metrics (MLflow tracks):

- matrix_sparsity: % of empty cells (high = users interact with few posts)
- avg_interactions_per_user: how active users are
- n_neighbors: how many similar users to check (default: 5)

Cold Start Problem: If user has no interactions → can't find similar users → returns
empty []

Simple as "Netflix recommendations" - watches similar shows → suggests new shows.

---

# How User-Item Matrix Becomes K-Nearest Neighbors

## The Matrix as Vectors

Each row in the table is a **vector** in high-dimensional space:

```
        post_0  post_1  post_2  ...  post_29
user1:   0.7     0.0     0.0    ...   0.7     ← Vector in 29D space
user10:  0.1     0.1     0.0    ...   0.7
user11:  0.0     0.7     0.0    ...   0.0
```

**Each user = point in 29-dimensional space**

## Visual Representation (Simplified to 2D)

In reality we have 29 dimensions (posts), but imagine 2 posts:

```
        post_8 (y-axis)
           ↑
        1.0│
           │  user1 ●
           │
        0.7│     user10 ●
           │              user11 ●
        0.5│
           │
        0.0└──────────────────────→ post_0 (x-axis)
           0   0.5   0.7   1.0

Closer points = similar users
```

## How KNN Finds k=5 Neighbors

### Step 1: Calculate Distance (Cosine Similarity)

For **user1** vs every other user:

```python
# user1's vector
user1 = [0.7, 0.0, 0.0, ..., 1.0, 0.7]

# user10's vector
user10 = [0.1, 0.1, 0.0, ..., 0.7, 0.7]

# Cosine similarity
similarity = (user1 · user10) / (||user1|| × ||user10||)

# Breakdown:
user1 · user10 = (0.7×0.1) + (0.0×0.1) + ... + (1.0×0.7) + (0.7×0.7)
               = 0.07 + 0 + ... + 0.7 + 0.49

distance = 1 - similarity  # sklearn uses distance, not similarity
```

### Step 2: Sort by Distance

```
User      Distance    Why?
----      --------    ----
user1     0.00        (itself)
user10    0.15        Both liked post_8, post_9
user14    0.23        Both liked post_0
user11    0.31        Some overlap in likes
user15    0.45        Less overlap
...
```

### Step 3: Pick Top k=5

```python
# KNN returns:
distances = [0.00, 0.15, 0.23, 0.31, 0.45]
indices   = [0,    10,   14,   11,   15]    # user indices

# These are user1's 5 nearest neighbors!
```

## Example: Why user10 is Similar to user1

Looking at the matrix:

```
        post_0  post_8  post_9  (other posts)
user1:   0.7     1.0     0.7    ...
user10:  0.1     0.7     0.7    ...
                  ↑       ↑
         Both interacted with post_8 and post_9!
```

**High overlap** → **Low distance** → **Neighbor!**

## Code Implementation

From `collaborative_filter.py:115`:

```python
# Get user1's vector
user_idx = self.user_id_to_idx["user1"]  # → 0
user_vector = self.user_item_matrix[0].reshape(1, -1)  # Shape: (1, 29)

# Find k=5 nearest neighbors
distances, indices = self.model.kneighbors(user_vector)

# Result:
# distances = [[0.0, 0.15, 0.23, 0.31, 0.45]]
# indices   = [[0, 10, 14, 11, 15]]
```

## Why Cosine Similarity?

**Cosine** measures **angle**, not magnitude:

```
user1:  [10, 0, 0]  ← Power user (many likes)
user10: [1,  0, 0]  ← Casual user (few likes)

Euclidean distance: LARGE (different magnitude)
Cosine similarity:  HIGH (same direction/taste!)
```

**Perfect for recommendations** - we care about **taste**, not **activity level**.

## Visualization in MLflow

The heatmap shows this matrix, where:

- **Similar rows** (horizontally) = users with similar taste
- **KNN clusters** these similar rows together
- **Dark red cells** in same columns = what makes users neighbors

## Summary

1. **Matrix** → Each row is a vector
2. **Vector space** → Each user is a point in 29D space
3. **Distance** → Calculated via cosine similarity
4. **KNN** → Finds k closest points (users)
5. **Recommend** → What neighbors liked that you haven't seen

---

# KNN Neighbor Graph Visualization

The system now creates a **network graph** showing which users are similar to each other!

## What the Graph Shows

**Logged to MLflow** as `visualizations/knn_graph.png`

### Elements:

**Nodes (circles)**:

- Each node = one user
- **Size** = how active the user is (more interactions = bigger node)
- Color = light blue

**Edges (lines)**:

- Connect similar users (neighbors from KNN)
- **Thickness** = similarity strength (thicker = more similar)
- **Color** = similarity (yellow → orange → red for increasing similarity)
- Only shows connections where similarity > 0.1

### Example Output:

```
=== KNN Neighbor Graph ===
Nodes: 20, Edges: 50
Average degree: 5.00
KNN graph logged to MLflow
```

- **20 nodes** = 20 users plotted
- **50 edges** = 50 similarity connections
- **Avg degree 5.0** = each user connected to ~5 neighbors (matches k=5!)

## How to Read the Graph

**Clusters (groups of connected nodes)**:

- Users in a cluster have similar taste
- Tightly connected = strong taste similarity
- Isolated nodes = unique taste (hard to recommend to)

**Node size**:

- Large nodes = power users (many interactions)
- Small nodes = casual users (few interactions)

**Edge thickness**:

- Thick edges = very similar users (e.g., both loved same posts)
- Thin edges = somewhat similar

## Real Example

```
    user1 ●━━━━━● user10  (thick edge = both liked post_8, post_9)
           ┃
           ┃ (medium edge)
           ┃
         user14 ●
```

**Interpretation:**

- user1 and user10 are very similar (thick edge)
- user1 and user14 are somewhat similar
- user10 likely hasn't seen what user1 liked → recommend!

## Use Cases

1. **Find user communities** - Clusters show user groups with similar interests
2. **Cold start detection** - Isolated nodes = users hard to recommend to
3. **Validate KNN** - Should see ~k edges per node (avg degree ≈ k)
4. **Debug recommendations** - See why certain users get recommended similar content

## Technical Details

From `collaborative_filter.py:232`:

- Uses NetworkX for graph construction
- Spring layout for positioning (similar users pulled together)
- Only plots first 20 users for readability
- Filters edges with similarity < 0.1 to reduce clutter
