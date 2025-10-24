"""Collaborative filtering recommendation implementation."""

import tempfile

import matplotlib.pyplot as plt
import mlflow
import mlflow.sklearn
import numpy as np
import polars as pl
import seaborn as sns
from sklearn.neighbors import NearestNeighbors

from app.domain.entities.interaction import Interaction
from app.domain.entities.recommendation import Recommendation
from app.domain.services.recommender_interface import RecommenderInterface


class CollaborativeFilterRecommender(RecommenderInterface):
    """User-based collaborative filtering recommender using k-nearest neighbors."""

    def __init__(self, interactions: list[Interaction], n_neighbors: int = 5):
        """Initialize recommender with interaction data.

        Args:
            interactions: List of user-post interactions
            n_neighbors: Number of similar users to consider
        """
        self.interactions = interactions
        self.n_neighbors = n_neighbors
        self.model: NearestNeighbors | None = None
        self.user_item_matrix: np.ndarray | None = None
        self.user_ids: list[str] = []
        self.post_ids: list[str] = []
        self.user_id_to_idx: dict[str, int] = {}
        self.post_id_to_idx: dict[str, int] = {}

    async def train(self) -> None:
        """Train the collaborative filtering model."""
        if not self.interactions:
            return

        with mlflow.start_run():
            # Build user-item interaction matrix
            self.user_ids = sorted({i.user_id for i in self.interactions})
            self.post_ids = sorted({i.post_id for i in self.interactions})

            self.user_id_to_idx = {uid: idx for idx, uid in enumerate(self.user_ids)}
            self.post_id_to_idx = {pid: idx for idx, pid in enumerate(self.post_ids)}

            # Log parameters
            mlflow.log_param("n_neighbors", self.n_neighbors)
            mlflow.log_param("n_users", len(self.user_ids))
            mlflow.log_param("n_posts", len(self.post_ids))
            mlflow.log_param("n_interactions", len(self.interactions))
            mlflow.log_param("metric", "cosine")
            mlflow.log_param("algorithm", "brute")

            # Create matrix with weighted interactions
            self.user_item_matrix = np.zeros((len(self.user_ids), len(self.post_ids)))

            for interaction in self.interactions:
                user_idx = self.user_id_to_idx[interaction.user_id]
                post_idx = self.post_id_to_idx[interaction.post_id]
                weight = interaction.get_weight()
                self.user_item_matrix[user_idx, post_idx] += weight

            # Calculate and log metrics
            sparsity = 1 - (np.count_nonzero(self.user_item_matrix) / self.user_item_matrix.size)
            mlflow.log_metric("matrix_sparsity", sparsity)

            avg_interactions_per_user = np.mean(np.sum(self.user_item_matrix > 0, axis=1))
            mlflow.log_metric("avg_interactions_per_user", float(avg_interactions_per_user))

            avg_interactions_per_post = np.mean(np.sum(self.user_item_matrix > 0, axis=0))
            mlflow.log_metric("avg_interactions_per_post", float(avg_interactions_per_post))

            # Visualize matrix and log to MLflow
            self._visualize_matrix()

            # Train KNN model
            actual_n_neighbors = min(self.n_neighbors, len(self.user_ids))
            self.model = NearestNeighbors(
                n_neighbors=actual_n_neighbors,
                metric="cosine",
                algorithm="brute",
            )
            self.model.fit(self.user_item_matrix)

            mlflow.log_param("actual_n_neighbors", actual_n_neighbors)

            # Visualize KNN neighbor graph
            self._visualize_knn_graph()

            # Log model
            mlflow.sklearn.log_model(self.model, "knn_model")

    async def generate_recommendations(
        self,
        user_id: str,
        limit: int = 50,
        exclude_post_ids: list[str] | None = None,
    ) -> list[Recommendation]:
        """Generate recommendations using collaborative filtering."""
        if self.model is None or self.user_item_matrix is None:
            return []

        if user_id not in self.user_id_to_idx:
            return []  # Cold start - user has no interactions

        exclude_post_ids = exclude_post_ids or []

        # Get user vector
        user_idx = self.user_id_to_idx[user_id]
        user_vector = self.user_item_matrix[user_idx].reshape(1, -1)

        # Find similar users
        distances, indices = self.model.kneighbors(user_vector)

        # Aggregate scores from similar users
        post_scores: dict[str, float] = {}
        user_interacted_posts = {
            self.post_ids[i]
            for i in range(len(self.post_ids))
            if self.user_item_matrix[user_idx, i] > 0
        }

        for neighbor_idx, distance in zip(indices[0], distances[0], strict=False):
            if neighbor_idx == user_idx:
                continue  # Skip self

            similarity = 1 - distance  # Convert distance to similarity
            neighbor_vector = self.user_item_matrix[neighbor_idx]

            for post_idx, score in enumerate(neighbor_vector):
                if score > 0:
                    post_id = self.post_ids[post_idx]

                    # Skip posts user already interacted with
                    if post_id in user_interacted_posts:
                        continue

                    # Skip excluded posts
                    if post_id in exclude_post_ids:
                        continue

                    # Weighted score by similarity
                    weighted_score = score * similarity
                    post_scores[post_id] = post_scores.get(post_id, 0) + weighted_score

        # Sort by score and create recommendations
        sorted_posts = sorted(post_scores.items(), key=lambda x: x[1], reverse=True)[:limit]

        # Normalize scores to 0-1 range
        if sorted_posts:
            max_score = sorted_posts[0][1]
            if max_score > 0:
                recommendations = [
                    Recommendation(
                        user_id=user_id,
                        post_id=post_id,
                        score=min(score / max_score, 1.0),
                        reason="collaborative_filtering",
                    )
                    for post_id, score in sorted_posts
                ]
            else:
                recommendations = []
        else:
            recommendations = []

        return recommendations

    def _visualize_matrix(self) -> None:
        """Visualize user-item matrix and log to MLflow."""
        if self.user_item_matrix is None:
            return

        # Convert to polars for easier inspection
        df = pl.DataFrame(
            self.user_item_matrix,
            schema={f"post_{i}": pl.Float64 for i in range(len(self.post_ids))},
        )
        df = df.with_columns(pl.Series("user_id", self.user_ids))
        df = df.select(["user_id"] + [col for col in df.columns if col != "user_id"])

        # Print matrix info
        print("\n=== User-Item Matrix ===")
        print(f"Shape: {self.user_item_matrix.shape} (users x posts)")
        print("\nFirst 10 rows, 10 cols:")
        print(df.head(10).select(df.columns[:11]))  # user_id + first 10 posts

        # Create heatmap visualization
        fig, ax = plt.subplots(figsize=(12, 8))

        # Limit to first 50x50 for readability
        sample_size = min(50, self.user_item_matrix.shape[0], self.user_item_matrix.shape[1])
        matrix_sample = self.user_item_matrix[:sample_size, :sample_size]

        sns.heatmap(
            matrix_sample,
            cmap="YlOrRd",
            ax=ax,
            cbar_kws={"label": "Interaction Weight"},
            xticklabels=self.post_ids[:sample_size] if sample_size <= 20 else False,
            yticklabels=self.user_ids[:sample_size] if sample_size <= 20 else False,
        )

        ax.set_title(f"User-Item Interaction Matrix (first {sample_size}x{sample_size})")
        ax.set_xlabel("Posts")
        ax.set_ylabel("Users")

        # Save and log to MLflow
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            plt.tight_layout()
            plt.savefig(tmp.name, dpi=100)
            mlflow.log_artifact(tmp.name, "visualizations")
            plt.close()

        print(f"\nHeatmap logged to MLflow (sample: {sample_size}x{sample_size})")
        print("=" * 50)

    def _visualize_knn_graph(self) -> None:
        """Visualize user-user similarity matrix using cosine similarity."""
        if self.model is None or self.user_item_matrix is None:
            return

        print("\n=== User-User Similarity Matrix ===")

        # Limit to first 20 users for readability
        n_users_to_plot = min(20, len(self.user_ids))
        user_subset = self.user_item_matrix[:n_users_to_plot]

        # Calculate cosine similarity matrix between users
        from sklearn.metrics.pairwise import cosine_similarity

        similarity_matrix = cosine_similarity(user_subset)

        # Create heatmap
        fig, ax = plt.subplots(figsize=(12, 10))

        sns.heatmap(
            similarity_matrix,
            annot=n_users_to_plot <= 10,  # Show values if small
            fmt=".2f",
            cmap="YlOrRd",
            square=True,
            cbar_kws={"label": "Cosine Similarity"},
            xticklabels=self.user_ids[:n_users_to_plot],
            yticklabels=self.user_ids[:n_users_to_plot],
            vmin=0,
            vmax=1,
            ax=ax,
        )

        ax.set_title(
            f"User-User Similarity Matrix (Cosine Similarity)\n{n_users_to_plot} users", fontsize=14
        )
        ax.set_xlabel("Users", fontsize=12)
        ax.set_ylabel("Users", fontsize=12)

        # Rotate labels for readability
        plt.xticks(rotation=45, ha="right")
        plt.yticks(rotation=0)

        # Save and log to MLflow
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            plt.tight_layout()
            plt.savefig(tmp.name, dpi=150, bbox_inches="tight")
            mlflow.log_artifact(tmp.name, "visualizations")
            plt.close()

        # Print stats
        avg_similarity = (np.sum(similarity_matrix) - n_users_to_plot) / (
            n_users_to_plot * (n_users_to_plot - 1)
        )
        print(f"Average user similarity: {avg_similarity:.3f}")
        print(f"Min similarity: {np.min(similarity_matrix[similarity_matrix > 0]):.3f}")
        print(f"Max similarity: {np.max(similarity_matrix[similarity_matrix < 1]):.3f}")
        print("User similarity matrix logged to MLflow")
        print("=" * 50)
