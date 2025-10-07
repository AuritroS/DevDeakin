// src/pages/Home/FeaturedSection.jsx
import React, { startTransition } from "react";
import { Header, Card, Button, Loader, Message } from "semantic-ui-react";
import { useNavigate } from "react-router-dom";
import ArticleCard from "../Articles/ArticleCard";
import QuestionCard from "../Questions/QuestionCard";
import styles from "./FeaturedSection.module.css";
import { useRecentPosts, useRecentQuestions } from "../../hooks/useRecent";

export default function FeaturedSection() {
  const navigate = useNavigate();
  const {
    data: posts,
    isLoading: lp,
    isError: ep,
    error: pe,
  } = useRecentPosts(6);
  const {
    data: questions,
    isLoading: lq,
    isError: eq,
    error: qe,
  } = useRecentQuestions(3);

  return (
    <div className={styles.section}>
      {/* ---------- Recent Articles ---------- */}
      <Header as="h2" className={styles.sectionHeader}>
        Recent Articles
      </Header>
      {ep ? (
        <Message negative>{pe?.message || "Failed to load articles."}</Message>
      ) : lp ? (
        <Loader active inline="centered" />
      ) : (
        <>
          <Card.Group centered>
            {(posts || []).map((p) => (
              <ArticleCard
                key={p.id}
                id={p.id}
                title={p.title}
                description={
                  p.abstract ||
                  (p.body ? String(p.body).slice(0, 140) + "…" : "")
                }
                author={p.authorDisplay || p.authorName || "—"}
                imageUrl={p.imageUrl}
              />
            ))}
          </Card.Group>
          <div className={styles.buttonWrapper}>
            <Button
              className="btn-primary"
              onClick={() =>
                startTransition(() => {
                  navigate("/articles");
                })
              }
            >
              See all articles
            </Button>
          </div>
        </>
      )}

      {/* ---------- Recent Questions ---------- */}
      <Header as="h2" className={styles.sectionHeader}>
        Recent Questions
      </Header>
      {eq ? (
        <Message negative>{qe?.message || "Failed to load questions."}</Message>
      ) : lq ? (
        <Loader active inline="centered" />
      ) : (
        <>
          <Card.Group centered>
            {(questions || []).map((q) => (
              <QuestionCard
                key={q.id}
                id={q.id}
                title={q.title}
                description={q.description}
                author={q.authorDisplay || q.authorName || "—"}
                tags={q.tags}
                createdAt={q.createdAt}
              />
            ))}
          </Card.Group>
          <div className={styles.buttonWrapper}>
            <Button
              className="btn-primary"
              onClick={() =>
                startTransition(() => {
                  navigate("/question");
                })
              }
            >
              Browse questions
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
