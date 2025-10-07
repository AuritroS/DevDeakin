// src/pages/Articles/ArticlesPage.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Header, Message, Loader, Icon } from "semantic-ui-react";

import ArticleCard from "./ArticleCard";
import styles from "./ArticlesPage.module.css";
import { useArticles } from "../../hooks/useArticles";

export default function ArticlesPage() {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useArticles();

  const loadMoreRef = useRef(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <Loader active inline="centered" />
      </div>
    );
  }

  if (isError) {
    return (
      <Message negative>{error?.message || "Failed to load articles."}</Message>
    );
  }

  // Flatten all loaded pages into one array
  const articles = data.pages.flatMap((page) => page.items);

  return (
    <div className={styles.page}>
      <Button
        labelPosition="left"
        className={styles.backBtn}
        onClick={() => navigate(-1)}
      >
        <Icon name="arrow left" /> Home
      </Button>

      <Header as="h2" className={styles.header}>
        All Articles
      </Header>

      <div className={styles.cards}>
        <Card.Group itemsPerRow={3} stackable className={styles.cards}>
          {articles.map((p) => (
            <ArticleCard
              key={p.id}
              id={p.id}
              title={p.title}
              description={
                p.abstract || (p.body ? String(p.body).slice(0, 160) + "…" : "")
              }
              imageUrl={p.imageUrl}
            />
          ))}
        </Card.Group>
      </div>

      {isFetchingNextPage && (
        <div className={styles.loadMore}>
          <Loader active inline="centered" />
        </div>
      )}

      {hasNextPage && (
        <div ref={loadMoreRef} className={styles.loadMoreSentinel} aria-hidden />
      )}

      {!hasNextPage && articles.length === 0 && (
        <div className={styles.empty}>
          <p>No articles yet.</p>
        </div>
      )}
    </div>
  );
}
